var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var server = require('http').createServer(express);
var io = require('socket.io')(server);
var siofu = require("socketio-file-upload");
const fs = require('fs')


var index = require('./routes/index');
var users = require('./routes/users');

var app = express().use(siofu.router);

var socketServer = express().use(siofu.router);
server.listen(7500);

function move(oldPath, newPath, callback) {

    fs.rename(oldPath, newPath, function (err) {
        if (err) {
            if (err.code === 'EXDEV') {
                copy();
            } else {
                callback(err);
            }
            return;
        }
        callback();
    });

    function copy() {
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);

        readStream.on('error', callback);
        writeStream.on('error', callback);

        readStream.on('close', function () {
            fs.unlink(oldPath, callback);
        });

        readStream.pipe(writeStream);
    }
}

function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}


io.on("connection", function(socket){
    var uploadDir = "/Users/robertjepson/Documents/Web/soundShare/sound-share-server/uploads/";
    var audioDir = "/Users/robertjepson/Documents/Web/soundShare/sound-share-server/sound-share/public/audio/"
    var loopDirName = audioDir + "loopOne.mp3";
    var uploader = new siofu();
    uploader.dir = uploadDir;
    uploader.listen(socket);
    uploader.on("error", function(event){
        console.log("Error from uploader", event);
    });
    uploader.on("saved", function(event){ // When the file has been saved...
        /* Logic required here:
          - check the user currently logged in
          - Put loop into their specific user archive folder
          - replace the loop in the current audio space with the new loop. (loopOne.mp3? etc.)
          - send an event to all users saying there's a new loop.


        */

        console.log("Upload Success!");
        var path = event.file.pathName;
        var renamed = uploadDir + "loopOne.mp3";
        fs.rename(path, renamed, function(err){
           if (err) {
              console.log(err);
            }
          copyFile(renamed, loopDirName, function(err){
            if (err) {
              console.log(err);
            }
        io.sockets.emit('newAudio', {user:0})


          })

        });



    });
});



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
