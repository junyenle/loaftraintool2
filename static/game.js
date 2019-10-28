// on receive message
var socket = io();
socket.on('message', function(data) {
  console.log(data);
});

// new player setup
socket.emit('new player');
setInterval(function() {
  socket.emit('movement', movement);
}, 1000 / 60);

var movement = {
  up: false,
  down: false,
  left: false,
  right: false
}

function setName() {
    var name = document.getElementById("setname").value;
    socket.emit('setname', name);
}

function setTank() {
    socket.emit('set tank');
}

function setHealer() {
    socket.emit('set healer');
}

function setDPS() {
    socket.emit('set dps');
}

document.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
    case 65: // A
      movement.left = true;
      break;
    case 87: // W
      movement.up = true;
      break;
    case 68: // D
      movement.right = true;
      break;
    case 83: // S
      movement.down = true;
      break;
  }
});
document.addEventListener('keyup', function(event) {
  switch (event.keyCode) {
    case 65: // A
      movement.left = false;
      break;
    case 87: // W
      movement.up = false;
      break;
    case 68: // D
      movement.right = false;
      break;
    case 83: // S
      movement.down = false;
      break;
    case 70: // F
      socket.emit('tsu2');
      break;
    case 69: // E
      socket.emit('pause');
      break;
  }
});

var canvas = document.getElementById('canvas');
canvas.width = 300;
canvas.height = 600;
var context = canvas.getContext('2d');
socket.on('state', function(players) {
  context.clearRect(0, 0, 300, 600);
  context.globalAlpha = 0.8;
  for (var id in players) {
    var radius = 10;
    var player = players[id];
    if (player.role == 'healer') {
        context.fillStyle = 'green';
    }
    if (player.role == 'dps') {
        context.fillStyle = 'red';
    }
    if (player.role == 'tank') {
        context.fillStyle = 'blue';
    }
    if (player.alive == false) {
        context.fillStyle = 'black';
    }
    if (player.active == true) {
        context.beginPath();
        context.arc(player.x, player.y, radius, 0, 2 * Math.PI);
        context.fill();
        if (player.stacking == true) {
            radius = 50;
            context.fillStyle = 'yellow';        
            context.arc(player.x - 5, player.y, radius, 0, 2 * Math.PI);
            context.fill();
        }
        if (player.murderer == true) {
            radius = 300;
            context.fillStyle = 'yellow';        
            context.arc(player.x - 5, player.y, radius, 0, 2 * Math.PI);
            context.fill();
        }
        if (player.coning == true) {
            console.log('coning');
            radius = 671;
            console.log(player.coney);
            console.log(player.conex);
            var pointangle = Math.atan2(player.coney, player.conex);
            console.log(pointangle);
            context.fillStyle = 'yellow';
            context.arc(player.x - 5, player.y, radius, pointangle - 0.175, pointangle + 0.175);
            context.fill();
        }
    }
  }
  for (var id in players) {
      context.globalAlpha = 1.0;
      var player = players[id];
      if (player.active == true) {
        context.font = "10px Arial";
        context.fillStyle = 'black';
        context.fillText(player.name, player.x + 10, player.y - 5);
        if (player.mechtimer > 0) {
            context.fillText(player.mechname, player.x + 12, player.y + 3);
            context.fillText ((Math.floor(player.mechtimer / 100)/10).toString(), player.x + 10, player.y + 11);
        }
      }
  }
});


