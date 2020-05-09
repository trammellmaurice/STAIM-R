const AUTOMATION_ON = true; //instantiate AI
const DEV = false; //Developer mode (cant die)
/***********************************************
NEURAL NETWORK PARAMETERS
*************************************************/
const NUM_INPUTS = 6; //fighter x and y , target x and y
const NUM_HIDDEN = 20;
const NUM_OUTPUTS = 3;
const NUM_SAMPLES = 1000000; //number of samples to train
const UP = 0;
const DOWN = 1;
const LEFT = 0;
const RIGHT = 1;
const LOW = 0;
const HIGH = 1;
const OUTPUT_THRESHOLD = 0.25; //how close it needs to be to commit to moving
/************************************************
GAME CONSTANTS
************************************************/
//AA GUN
const TARGET_SIZE = 30;
const TRACK_SPEED = 10;
const RAISE_SPEED = 8;
const TARGET_THRESHOLD = 50;
const LETHAL = true; //will or will not simulate kill
//FIGHTER CONSTANTS
KILL_COUNT = 1000;
// BOTH CONSTANTS
const MAX_WIDTH = window.innerWidth;
const MAX_HEIGHT = window.innerHeight;
const MAX_ALT = 1500;
var aaGun = true; //trigger with altitude trip
/********************************************************************
NEURAL NETWORK
********************************************************************/
var nn;
if(AUTOMATION_ON){
  nn = new NeuralNetwork(NUM_INPUTS, NUM_HIDDEN, NUM_OUTPUTS);
  //train the network
  let fx, fy, tx, ty;
  for (let i = 0; i < NUM_SAMPLES; i++){
    //random fighter position
    // TODO: may need to be updated
    fx = Math.random() * MAX_WIDTH;
    fy = Math.random() * MAX_HEIGHT;
    fz = Math.random() * MAX_ALT;
    //random target positions
    tx = Math.random() * MAX_WIDTH;
    ty = Math.random() * MAX_HEIGHT;
    tz = Math.random() * MAX_ALT;
    // calculate vector to fighter
    let track_vector = findVector(tx,ty,tz,fx,fy,fz);
    // determine how to move
    let hor = track_vector[0] > 0 ? RIGHT : LEFT;
    let ver = track_vector[1] > 0 ? DOWN : UP;
    let heig = track_vector[2] > 0 ? HIGH : LOW;
    // train network
    nn.train(normalizeInput(fx,fy,fz,tx,ty,tz), [hor,ver,heig]);
  }
}
//Normalize the data for input
function normalizeInput(fighterX, fighterY, fighterZ, targetX, targetY, targetZ){
  // normalize to between 0 and 1
  let input = [];
  input[0] = (fighterX/MAX_WIDTH);
  input[1] = (fighterY/MAX_HEIGHT);
  input[2] = (fighterZ/MAX_HEIGHT);
  input[3] = (targetX/MAX_WIDTH);
  input[4] = (targetY/MAX_HEIGHT);
  input[5] = (targetZ/MAX_HEIGHT);
  return input;
}
//calculate attack vector for training data
function findVector(tx,ty,tz,fx,fy,fz) {
  //calculate components
  let vx = fx - tx;
  let vy = fy - ty;
  let vz = fz - tz;
  return [vx,vy,vz];
}
 /******************************************
 START
 ******************************************/
function startEnvironment() {
  environment.start();
}
/*******************************************
SIMULATION ENVIRONMENT
********************************************/
var environment = {
  counter : 1,
  clock : 0,
  //create a canvas element
  canvas : document.createElement("canvas"),
  start : function() {
    this.canvas.width = MAX_WIDTH;
    this.canvas.height = MAX_HEIGHT;
    this.context = this.canvas.getContext("2d");
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    this.interval = setInterval(updateEnvironment, 20);
    //add listeners for keys
    window.addEventListener('keydown',function(e){
      e.preventDefault();
      environment.keys = (environment.keys || []);
      environment.keys[e.keyCode] = (e.type == "keydown");
    })
    window.addEventListener('keyup',function (e){environment.keys[e.keyCode] = (e.type == "keydown");})
  },
  clear : function() {this.context.clearRect(0,0,MAX_WIDTH,MAX_HEIGHT);}
}
/*******************************************************
AI ANTI AIRCRAFT GUN
*******************************************************/
//Anti Air - track a target
//TODO: 3d Tracking
//--------------------------------------------------------------------------------------------------------------
var aa = {
  x : 20,
  y : 20,
  z : 0,
  active : false,
  update : function() {
    //check boundaries to loop
    if(this.x > MAX_WIDTH){this.x = 0;}
    if(this.x < 0){this.x = MAX_WIDTH;}
    if(this.y > MAX_HEIGHT){this.y = 0;}
    if(this.y < 0){this.y = MAX_HEIGHT;}
    if(aaGun){this.drawTarget();}
  },
    righ : function(){this.x+=TRACK_SPEED;},
    lef : function(){this.x-=TRACK_SPEED;},
    up : function(){this.y-=TRACK_SPEED;},
    down : function(){this.y+=TRACK_SPEED;},
    raise : function(){this.z+=RAISE_SPEED;},
    lower : function(){this.z-=RAISE_SPEED;},
    drawTarget : function(){
      ctx = environment.context;
      ctx.moveTo(this.x,this.y);
      // TODO: adjust target size to get smaller above and below the fighter's altitude
      if(Math.abs(fighter.alt - this.z) >= TARGET_THRESHOLD){
        ctx.strokeStyle = "gray";
        this.active = false;
      }
      else{
        ctx.strokeStyle = "#FF0000";
        this.active = true;
      }
      ctx.beginPath();
      ctx.arc(this.x,this.y, TARGET_SIZE, 0.5*Math.PI, 2.5 * Math.PI);
      ctx.stroke();
    },
    kill : function() {
      //if target lock for kill count
      if(!LETHAL){
        return;
      }
      if(fighter.targetLock()){
        setTimeout(function(){
          if(fighter.targetLock()){
            setTimeout(function(){
              if(fighter.targetLock()){
                setTimeout(function(){
                  if(fighter.targetLock()){fighter.alive = false; console.log('kill.');}
                }, KILL_COUNT);
              }
            }, KILL_COUNT);
          }
        }, KILL_COUNT);
      }
    }
  }
/********************************************************
FIGHTER CLASS
*********************************************************/
var fighter = {
  alive : true,
  counter : 0,
  flasher : 0,
  //creating the fighter to control
  width : 15,
  height : 15,
  x : MAX_WIDTH/2, //current position
  y : MAX_HEIGHT/2, //current position
  vx : 0,
  vy : 0,
  thr : 0, //will add to velocity instantly
  thrx : 0,
  thry : 0,
  yaw : 0, //will be positive or negative to adjust angle
  theta : 0,
  angle : 0,//for telemetry data
  fall : 0,
  lift : 0,
  momentumx : 0, //can be used to keep the fighter moving?
  momentumy : 0,
  airbrake : false,
  burn : false,
  alt : 500, // should not go to 0 or crash || 0.1 list from thrust -0.1 from drag
  Target : false,
  update : function(){
    ctx = environment.context;
    if(this.alt <= 200){
      ctx.fillStyle = '#FFFAB3';
      ctx.fillRect(0,0,MAX_WIDTH,MAX_HEIGHT);
    }
    if(this.alt <= 100){
      ctx.fillStyle = '#FFCCCC';
      ctx.fillRect(0,0,MAX_WIDTH,MAX_HEIGHT);
      if(this.counter < 40){
        ctx.fillStyle = "black";
        //Top
        ctx.fillText('**__LOW__ALTITUDE__**',20,MAX_HEIGHT-20);
        ctx.fillText('**__LOW__ALTITUDE__**',120,MAX_HEIGHT-20);
        ctx.fillText('**__LOW__ALTITUDE__**',220,MAX_HEIGHT-20);
        ctx.fillText('**__LOW__ALTITUDE__**',320,MAX_HEIGHT-20);
        ctx.fillText('**__LOW__ALTITUDE__**',420,MAX_HEIGHT-20);
        ctx.fillText('**__LOW__ALTITUDE__**',20,MAX_HEIGHT-60);
        ctx.fillText('**__LOW__ALTITUDE__**',120,MAX_HEIGHT-60);
        ctx.fillText('**__LOW__ALTITUDE__**',220,MAX_HEIGHT-60);
        ctx.fillText('**__LOW__ALTITUDE__**',320,MAX_HEIGHT-60);
        ctx.fillText('**__LOW__ALTITUDE__**',420,MAX_HEIGHT-60);
        ctx.fillText('**__LOW__ALTITUDE__**',20,MAX_HEIGHT-100);
        ctx.fillText('**__LOW__ALTITUDE__**',120,MAX_HEIGHT-100);
        ctx.fillText('**__LOW__ALTITUDE__**',220,MAX_HEIGHT-100);
        ctx.fillText('**__LOW__ALTITUDE__**',320,MAX_HEIGHT-100);
        ctx.fillText('**__LOW__ALTITUDE__**',420,MAX_HEIGHT-100);
        //Bottom
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-20,20);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-120,20);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-220,20);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-320,20);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-420,20);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-20,60);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-120,60);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-220,60);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-320,60);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-420,60);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-20,100);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-120,100);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-220,100);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-320,100);
        ctx.fillText('**__LOW__ALTITUDE__**',MAX_WIDTH-420,100);
      }else if(this.counter > 90)
      {
        this.counter = 0;
      }
      this.counter++;
      // this.counter = 0;
    }
    ctx.save();
    drawTriangle(ctx, this.x, this.y, this.theta, this.width, this.height);
    ctx.restore();
    ctx.save();
    if(this.target == true)
    {
      drawTarget(ctx, this.x,this.y, this.theta, this.height);
      this.target = false;
    }
    ctx.restore();
  },
  newPos : function(){
    this.theta += this.yaw * Math.PI / 180;
    this.angle += this.yaw; //for telemetry data
    if(this.angle >= 360){this.angle-=360;}
    if(this.angle < 0){this.angle+=360;}
    this.thrx = this.thr * Math.sin(this.theta);
    this.thry = this.thr * Math.cos(this.theta);
    if(Math.abs(this.thrx) > 0){this.momentumx = this.thrx;}
    if(Math.abs(this.thry) > 0){this.momentumy = this.thry;}
    //check gravity v lift
    this.gravity();
    this.alt += this.lift - this.fall;
    //add momentum
    if(Math.sqrt(Math.pow(this.vx,2) + Math.pow(this.vy,2)) < 9.9){
      // console.log('ye');
      this.vx += this.momentumx;
      this.vy += this.momentumy;
    }
    //check boundaries to loop
    if(this.x > MAX_WIDTH){this.x = 0;}
    if(this.x < 0){this.x = MAX_WIDTH;}
    if(this.y > MAX_HEIGHT){this.y = 0;}
    if(this.y < 0){this.y = MAX_HEIGHT;}
    this.x += this.vx;
    this.y -= this.vy;
  },
  thrust : function(){
    if(!this.burn){this.thr = 10;}
    else{this.thr = 17;}
    this.lift = 5;
  },
  break : function(){},
  turn : function(dir){
    //change angle of fighter
    if(dir == -1){this.yaw-=5;}
    else if(dir == 1){this.yaw+=5;}
  },
  drag : function(){
    if(!this.airbrake){
      //stop changes so they dont go on forever
      if(this.momentumx > 0){this.momentumx -= 0.1;}
      else if(this.momentumx < 0){this.momentumx += 0.1;}
      if(this.momentumy > 0){this.momentumy -= 0.1;}
      else if(this.momentumy < 0){this.momentumy += 0.1;}
    }
    else{
      this.momentumx = 0;
      this.momentumy = 0;
    }
    this.lift = 0;
    this.fall = 0;
    this.vx = 0;
    this.vy = 0;
    this.thr = 0;
    this.yaw = 0; //set yaw back to 0 after the movement
    this.ground();
  },
  laze : function(){
    this.target = true;
  },
  gravity : function() {
    this.fall += 5;
  },
  climb : function() {
    if(this.alt <= MAX_HEIGHT)
    {
      this.lift += 10;
    } else{
      this.alt = MAX_HEIGHT;
    }
  },
  drop : function() {
    this.fall += 10;
  },
  ground : function() {
    //check if fighter is too low
    if(this.alt <=0 )
    {
      // console.log('dead');
      if(!DEV){
        this.alive = false;
        console.log('crash');
      }
      this.alt = 0;
    }
  },
  //HUD  telemetry indication
  //--------------------------------------------
  hud : function(){
    ctx = environment.context;
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    //update telemetry
    ctx.fillText('x:'+this.x.toFixed().toString()+'  y:'+this.y.toFixed().toString()+'  alt:'+this.alt.toFixed().toString()+'m',20,20);
    ctx.fillText('vx:'+this.vx.toFixed().toString()+'m/s'+'  vy:'+this.vy.toFixed().toString()+'m/s'+'  at-ang:'+fighter.angle.toFixed().toString()+'°', 20, 60);
    ctx.fillText('thr:'+this.thr.toFixed().toString()+'m/sE2'+'  climb:'+(this.lift-this.fall).toFixed().toString()+ 'm/s'+'  yaw:'+this.yaw.toFixed().toString()+'°',20,100);
    ctx.fillText('mox:'+this.momentumx.toFixed().toString()+'m/s'+'  moy:'+this.momentumy.toFixed().toString()+'m/s',20,140);
    var brake;
    if (this.airbrake){brake = 'engaged';}else{brake = 'disengaged';}this.airbrake = false;
    ctx.fillText('RB: '+brake,20,180);
    if(this.burn){ctx.fillText('burner: engaged',100,180);}else{ctx.fillText('burner: disengaged',100,180);}this.burn = false;
    if(this.targetLock() && aa.active){
      if(fighter.flasher < 40){
        ctx.fillStyle = "red";
        ctx.fillText('AA target: locked', 20,210);//output telemetry data
      }else if(fighter.flasher > 90)
      {fighter.flasher = 0;}
      fighter.flasher++;
    }
    ctx.beginPath();
    ctx.rect(10, 10, 230, 220);
    ctx.stroke();
  },
  targetLock : function(){
    if(this.x < aa.x + TARGET_SIZE && this.x > aa.x - TARGET_SIZE && aaGun){return true;}
    return false;
  }
}
//Log the fighter telemetry data for debugging
//-----------------------------------------------------------------------------------------
function logTelemetry(clear = false) {
  if((environment.counter % 15 == 0) && clear)
  {
    console.clear();
    environment.counter = 1;
  }
  else{environment.counter++;}
  console.log('x:',fighter.x,'y:',fighter.y,'vx:',fighter.vx,'vy:',fighter.vy);
  console.log('thr:',fighter.thr,'yaw:',fighter.yaw,'ang:',fighter.angle);
  console.log('alt:',fighter.alt,'climb:',fighter.lift-fighter.fall);
  console.log('mox:',fighter.momentumx,'moy:',fighter.momentumy);//output telemetry data
}
/************************************************************
DRAWING
************************************************************/
//stuff to get the canvas running and update it^^
//--------------------------------------------
//Triangle stuff (draw it with the x,y at centroid)
function drawTriangle(ctx, x, y, ang, width, height){
  ctx.translate(x,y);
  ctx.rotate(ang);
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.moveTo(0, 0-height/2);
  ctx.lineTo(0-width/2, 0+height/2);
  ctx.lineTo(0+width/2, 0+height/2);
  ctx.closePath();
  ctx.stroke();
}
//DRAW target
//------------------------------------------------------
function drawTarget(ctx, x, y, ang,height){
  ctx.translate(x,y);
  ctx.rotate(ang);
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.arc(0,-60, 30, 0.5*Math.PI, 2.5 * Math.PI);
  ctx.stroke();
}
/**************************************************************
UPDATE THE ENVIRONMENT
*****************************************************************/
function updateEnvironment() {
  environment.clear();
  if(AUTOMATION_ON)
  {
    if(fighter.alt <= MAX_HEIGHT && fighter.alt >= 100 ){aaGun = true;}else{aaGun = false;}
  }
  if(fighter.alive || DEV){ //ONLY ALLOW CONTROLS IF fighter IS ALIVE
    if(environment.keys && environment.keys[87]){
      fighter.thrust();
      if(environment.keys && environment.keys[9]){fighter.climb();}
    }
    if(environment.keys && environment.keys[65]){fighter.turn(-1);}
    if(environment.keys && environment.keys[68]){fighter.turn(1);}
    if(environment.keys && environment.keys[32]){fighter.laze();}
    if(environment.keys && environment.keys[16]){fighter.drop();}
    if(environment.keys && environment.keys[83]){fighter.airbrake = true;fighter.drag();}
    if(environment.keys && environment.keys[66])
    {
      if(environment.keys && environment.keys[87])
      {
        fighter.burn = true;fighter.thrust();
        if(environment.keys && environment.keys[9]){fighter.climb();}
      }
    }
  }
    fighter.newPos(); //calculate the new position
  // logTelemetry();
  fighter.update();
  if(!AUTOMATION_ON){
    if(environment.keys && environment.keys[104]){aa.up();}
    if(environment.keys && environment.keys[98]){aa.down();}
    if(environment.keys && environment.keys[100]){aa.lef();}
    if(environment.keys && environment.keys[102]){aa.righ();}
    if(environment.keys && environment.keys[107]){aa.raise();}
    if(environment.keys && environment.keys[13]){aa.lower();}
  }else if(aaGun){
    //CONTROL AA
    //prediction based on current data
    let fx = fighter.x;
    let fy = fighter.y;
    let fz = fighter.alt;
    let tx = aa.x;
    let ty = aa.y;
    let tz = aa.z;
    let predict = nn.feedForward(normalizeInput(fx,fy,fz,tx,ty,tz)).data[0];
    //make movement (left or right)
    let dLeft = Math.abs(predict[0] - LEFT);
    let dRight = Math.abs(predict[0] - RIGHT);
    //compare to OUTPUT_THRESHOLD
    if(dLeft < OUTPUT_THRESHOLD){aa.lef();}else if(dRight < OUTPUT_THRESHOLD){aa.righ();}
    //make movement (up or down)
    let dUp = Math.abs(predict[1] - UP);
    let dDown = Math.abs(predict[1] - DOWN);
    //compare to OUTPUT_THRESHOLD
    if(dUp < OUTPUT_THRESHOLD){aa.up();}else if(dDown < OUTPUT_THRESHOLD){aa.down();}
    //make movement (raise or lower)
    let dRaise = Math.abs(predict[2] - HIGH);
    let dLower = Math.abs(predict[2] - LOW);
    //compare to OUTPUT_THRESHOLD
    if(dRaise < OUTPUT_THRESHOLD){aa.raise();}else if(dLower < OUTPUT_THRESHOLD){aa.lower();}
  }
  aa.update();
  fighter.hud();
  aa.kill();
  fighter.drag();
  fighter.ground(); //apply drag after calculating the new position
}
