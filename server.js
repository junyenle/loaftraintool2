// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function dot(x1, x2, y1, y2) {
    return x1 * x2 + y1 * y2;
}

app.set('port', process.env.PORT || 5000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(process.env.PORT || 5000, function() {
  console.log('Starting server on port 5000');
});

// Add the WebSocket handlers
io.on('connection', function(socket) {
});

var mechanicsOn = false;
var mechCounter = 0;
var players = {};
var paused = false;
playercounter = 0;
io.on('connection', function(socket) {
  socket.on('new player', function() {
    var role = 'dps';
    if (playercounter < 2)
    {
        role = 'tank';
    }
    else if (playercounter < 4)
    {
        role = 'healer';
    }
    players[socket.id] = {
      x: 150,
      y: 300,
      active: true,
      alive: true,
      role: role,
      mechanic: 'none',
      facing: 'up',
      stacking: false,
      murderer: false,
      waters: false,
      name: '',
      mechname: 'none',
      mechtimer: 0,
      coning: false,
      conex: 0,
      coney: 0
    };
    playercounter += 1;
    io.sockets.emit('message', playercounter);
  });
  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
    if (data.left && player.alive == true) {
      player.x -= 3;
      player.facing = 'left';
      if (player.x < 0)
      {
          player.alive = false;
      }
    }
    if (data.up && player.alive == true) {
      player.y -= 3;
      player.facing = 'up';
      if (player.y < 0)
      {
          player.alive = false;
      }
    }
    if (data.right && player.alive == true) {
      player.x += 3;
      player.facing = 'right';
      if (player.x > 300)
      {
          player.alive = false;
      }
    }
    if (data.down && player.alive == true) {
      player.y += 3;
      player.facing = 'down';
      if (player.y > 600)
      {
          player.alive = false;
      }
    }
  });
  socket.on('set tank', function(data) {
    var player = players[socket.id] || {};
    player.role = 'tank'
  });
  socket.on('set healer', function(data) {
    var player = players[socket.id] || {};
    player.role = 'healer'
  });
  socket.on('set dps', function(data) {
    var player = players[socket.id] || {};
    player.role = 'dps'
  });
  socket.on('disconnect', function() {
    var player = players[socket.id] || {};
    player.active = false;
    io.sockets.emit('message', 'disconnect');
    playercounter -= 1;
  });
  
  socket.on('pause', function() {
    var player = players[socket.id];
    if (player.name == 'raimi')
    {
        paused = !paused;
        if (!paused) {
            io.sockets.emit('message', 'unpaused');
        }
        if (paused) {
            io.sockets.emit('message', 'paused');
        }
    }
  });
  
  socket.on('setname', function(data) {
      var player = players[socket.id];
      player.name = data;
      io.sockets.emit('message', 'changed name:');
      io.sockets.emit('message', player.name);
  });
  
  // tsunami 2 specific    
  socket.on('tsu2', function() {
    var player = players[socket.id];
    if (player.name != 'raimi')
    {
        return;
    }
    mechanicsOn = !mechanicsOn;
    if (mechanicsOn) {        
      io.sockets.emit('message', 'tsu2 activated');
      var mechanics = {};
      mechanics['dpscircle'] = true;
      mechanics['dpsline'] = true;
      mechanics['dpscone'] = true;
      mechanics['dpsstack'] = true;
      mechanics['tankline'] = true;
      mechanics['tankmurder'] = true;
      mechanics['healercone'] = true;
      mechanics['healerstack'] = true;
      for (var id in players) {
        var player = players[id];
        if (player.active = true)
        {
            player.waters = true;
            // assign mechanics by role here
            if (player.role == 'dps') {
               var rolesleft = [];
               if (mechanics['dpscircle']) {
                   rolesleft.push('dpscircle');
               } 
               if (mechanics['dpsline']) {
                   rolesleft.push('dpsline');
               } 
               if (mechanics['dpscone']) {
                   rolesleft.push('dpscone');
               } 
               if (mechanics['dpsstack']) {
                   rolesleft.push('dpsstack');
               } 
               var randomChoice = getRandomInt(rolesleft.length);
               player.mechanic = rolesleft[randomChoice];
               mechanics[player.mechanic] = false;
               io.sockets.emit('message', player.mechanic);
               if (player.mechanic == 'dpscircle') {
                   player.mechname = 'circle';
                   player.mechtimer = 8000;
               }
               else if (player.mechanic == 'dpsline') {
                   player.mechname = 'line';
                   player.mechtimer = 20000;
               }
               else if (player.mechanic == 'dpscone') {
                   player.mechname = 'cone';
                   player.mechtimer = 14000;
               }
               else if (player.mechanic == 'dpsstack') {
                   player.mechname = 'stack';
                   player.mechtimer = 10000;
               }
            } // end dps assignment
            if (player.role == 'healer') {
               var rolesleft = [];
               if (mechanics['healercone']) {
                   rolesleft.push('healercone');
               } 
               if (mechanics['healerstack']) {
                   rolesleft.push('healerstack');
               }
               var randomChoice = getRandomInt(rolesleft.length);
               player.mechanic = rolesleft[randomChoice];
               mechanics[player.mechanic] = false;
               io.sockets.emit('message', player.mechanic);
               if (player.mechanic == 'healercone') {
                   player.mechname = 'cone';
                   player.mechtimer = 14000;
               }
               else if (player.mechanic == 'healerstack') {
                   player.mechname = 'stack';
                   player.mechtimer = 10000;
               }
            } // end healer assignment
            if (player.role == 'tank') {
               var rolesleft = [];
               if (mechanics['tankline']) {
                   rolesleft.push('tankline');
               } 
               if (mechanics['tankmurder']) {
                   rolesleft.push('tankmurder');
               }
               var randomChoice = getRandomInt(rolesleft.length);
               player.mechanic = rolesleft[randomChoice];
               mechanics[player.mechanic] = false;
               io.sockets.emit('message', player.mechanic);
               if (player.mechanic == 'tankline') {
                   player.mechname = 'line';
                   player.mechtimer = 24000;
               }
               else if (player.mechanic == 'tankmurder') {
                   player.mechname = 'murder';
                   player.mechtimer = 28000;
               }
            } // end tank assignment
        }
      
      }
      
    }
    else { // turning mechanics off
      io.sockets.emit('message', 'tsu2 deactivated');
      // reset mechanics
      for (var id in players) {
        var player = players[id];
        player.mechanic = 'none';
        player.alive = true;
        player.x = 150;
        player.y = 300;
        player.stacking = false;
        player.murderer = false;
        player.waters = false;
        player.mechname = 'none';
        player.mechtimer = 0;
        player.coning = false;
        player.conex = 0;
        player.coney = 0;
      }
      mechanicsOn = false;
      mechCounter = 0;
    }
  });
});

setInterval(function() {
  if (mechanicsOn == true && !paused)
  {
    // tsunami 2 specific
      for (var id in players) {
        var player = players[id];
        if (player.mechanic == 'dpscircle') {
            var kbstr = 3;
            if (mechCounter > 8000 && mechCounter < 9000) {
                for (var oid in players)
                {
                    if (id == oid) { continue; }
                    else {
                        var oplayer = players[oid];
                        var kbdirX = oplayer.x - player.x;
                        var kbdirY = oplayer.y - player.y;
                        var vectorLength = Math.sqrt(kbdirX * kbdirX + kbdirY * kbdirY);
                        var normkbdirX = kbdirX / vectorLength;
                        var normkbdirY = kbdirY / vectorLength;
                        oplayer.x += kbstr * normkbdirX;
                        oplayer.y += kbstr * normkbdirY;
                        if (oplayer.x < 0 || oplayer.x > 300 || oplayer.y < 0 || oplayer.y > 600) {
                            oplayer.alive = false;
                        }
                    }
                }
            }
        }
        else if (player.mechanic == 'dpsline') {
            var kbstr = 5;
            var kbdirX = 0;
            var kbdirY = 0;
            if (mechCounter > 20000 && mechCounter < 21000) {
                if (player.facing == 'left')
                {
                    kbdirX = -1;
                }
                else if (player.facing == 'right')
                {
                    kbdirX = 1;
                }
                else if (player.facing == 'up')
                {
                    kbdirY = -1;
                }
                else if (player.facing == 'down')
                {
                    kbdirY = 1;
                }
                for (var oid in players)
                {
                    if (id == oid) { continue; }
                    else {
                        var oplayer = players[oid];
                        if (player.facing == 'left' && oplayer.x < player.x)
                        {
                            oplayer.x += kbstr * kbdirX;
                            oplayer.waters = false;
                        }
                        else if (player.facing == 'right' && oplayer.x > player.x)
                        {
                            oplayer.x += kbstr * kbdirX;
                            oplayer.waters = false;
                        }
                        else if (player.facing == 'up' && oplayer.y < player.y)
                        {
                            oplayer.y += kbstr * kbdirY;
                            oplayer.waters = false;
                        }
                        else if (player.facing == 'down' && oplayer.y > player.y)
                        {
                            oplayer.y += kbstr * kbdirY;
                            oplayer.waters = false;
                        }
                        if (oplayer.x < 0 || oplayer.x > 300 || oplayer.y < 0 || oplayer.y > 600) {
                            oplayer.alive = false;
                        }
                    }
                }
            }
        }
        else if (player.mechanic == 'dpscone' || player.mechanic == 'healercone') {
            var coneDot = 0.98; // greater than this means you die. about 10 degrees either side
            if (mechCounter > 14000 && mechCounter < 14300) {
                player.coning = true;
                var furthestid = id;
                var furthestdistsq = 0;
                for (var oid in players)
                {
                    var oplayer = players[oid];
                    var xdist = oplayer.x - player.x;
                    var ydist = oplayer.y - player.y;
                    var distsq = xdist * xdist + ydist * ydist
                    if (distsq > furthestdistsq) {
                        furthestdistsq = distsq;
                        furthestid = oid;
                    }
                }
                // vector from me to furthest
                var furthestplayer = players[furthestid];
                var xfurthest = furthestplayer.x - player.x;
                var yfurthest = furthestplayer.y - player.y;
                var xfurthestnorm = xfurthest / Math.sqrt(xfurthest * xfurthest + yfurthest * yfurthest);
                var yfurthestnorm = yfurthest / Math.sqrt(xfurthest * xfurthest + yfurthest * yfurthest);
                player.conex = xfurthestnorm;
                player.coney = yfurthestnorm;
                //io.sockets.emit('message', player.coney);
                //io.sockets.emit('message', player.conex);
                for (var oid in players) {
                    if (oid == id) {
                        continue;
                    }
                    var oplayer = players[oid];
                    var xoplayer = oplayer.x - player.x;
                    var yoplayer = oplayer.y - player.y;
                    var xoplayernorm = xoplayer / Math.sqrt(xoplayer * xoplayer + yoplayer * yoplayer);
                    var yoplayernorm = yoplayer / Math.sqrt(xoplayer * xoplayer + yoplayer * yoplayer);
                    //io.sockets.emit('message', dot(xfurthestnorm, xoplayernorm, yfurthestnorm, yoplayernorm));
                    if (dot(xfurthestnorm, xoplayernorm, yfurthestnorm, yoplayernorm) > coneDot) {
                        if (oplayer.role != 'tank') {
                            io.sockets.emit('message', 'killing player');
                            oplayer.alive = false;
                        }
                    }   
                }
            }
            else {
                player.coning = false;
                player.conex = 0;
                player.coney = 0;
            }
        }
        else if (player.mechanic == 'dpsstack' || player.mechanic == 'healerstack') {
            if (mechCounter > 10000 && mechCounter < 10300) {
                player.stacking = true;
                var doublestacking = false;
                var stackers = [];
                stackers.push(id);
                for (var oid in players)
                {
                    if (id == oid) { continue; }
                    else {
                        var oplayer = players[oid];
                        var xdist = oplayer.x - player.x;
                        var ydist = oplayer.y - player.y;
                        if (xdist * xdist + ydist * ydist < 2500)
                        {
                            stackers.push(oid);
                            //io.sockets.emit('message', oid);
                            if (oplayer.mechanic == 'healerstack' || oplayer.mechanic == 'dpsstack') {
                                doublestacking = true;
                            }
                        }
                    }
                }
                if (stackers.length < 4 || doublestacking)
                {
                    for (var i = 0; i < stackers.length; i+= 1) {
                        //io.sockets.emit('message', stackers[i]);
                        players[stackers[i]].alive = false;

                        //io.sockets.emit('message', 'killing player');
                    }
                }
            }
            else {
                player.stacking = false;
            }
        }
        else if (player.mechanic == 'tankline') {
            var kbstr = 5;
            var kbdirX = 0;
            var kbdirY = 0;
            if (mechCounter > 24000 && mechCounter < 25000) {
                if (player.facing == 'left')
                {
                    kbdirX = -1;
                }
                else if (player.facing == 'right')
                {
                    kbdirX = 1;
                }
                else if (player.facing == 'up')
                {
                    kbdirY = -1;
                }
                else if (player.facing == 'down')
                {
                    kbdirY = 1;
                }
                for (var oid in players)
                {
                    if (id == oid) { continue; }
                    else {
                        var oplayer = players[oid];
                        if (player.facing == 'left' && oplayer.x < player.x)
                        {
                            oplayer.x += kbstr * kbdirX;
                            oplayer.waters = false;
                        }
                        else if (player.facing == 'right' && oplayer.x > player.x)
                        {
                            oplayer.x += kbstr * kbdirX;
                            oplayer.waters = false;
                        }
                        else if (player.facing == 'up' && oplayer.y < player.y)
                        {
                            oplayer.y += kbstr * kbdirY;
                            oplayer.waters = false;
                        }
                        else if (player.facing == 'down' && oplayer.y > player.y)
                        {
                            oplayer.y += kbstr * kbdirY;
                            oplayer.waters = false;
                        }
                        if (oplayer.x < 0 || oplayer.x > 300 || oplayer.y < 0 || oplayer.y > 600) {
                            oplayer.alive = false;
                        }
                    }
                }
            }
            
        }
        else if (player.mechanic == 'tankmurder') {
            if (mechCounter > 28000 && mechCounter < 28300) {
                player.murderer = true;
                for (var oid in players)
                {
                    if (id == oid) { continue; }
                    else {
                        var oplayer = players[oid];
                        var xdist = oplayer.x - player.x;
                        var ydist = oplayer.y - player.y;
                        if (xdist * xdist + ydist * ydist < 90000)
                        {
                            oplayer.alive = false;
                        }
                    }
                }
            }
            else {
                player.murderer = false;
            }
        }
        if (player.waters == true) {
            if (mechCounter > 28000) {
                player.alive = false;
            }
        
        }
        player.mechtimer -= 16.7
      } // end for player
      
      mechCounter += 16.7; // miliseconds
      
  }
  io.sockets.emit('state', players);
}, 1000 / 60); // 60 fps
