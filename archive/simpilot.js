//MEREDITH
/*******************************************************
*                 MISSION
Build an AI that can pilot a simulated fighter jet
*******************************************************/
// const AUTOMATION_ON = false; //AI CONTROL
const AUTOMATION_ON = true;

const DEV = true; //Developer mode (can't die)
/**********************************************
        SIMULATION ENVIRONMENT CONSTANTS
***********************************************/
//CONSTANTS
const MAX_WIDTH = window.innerWidth;
const MAX_HEIGHT = window.innerHeight;
const MAX_ALT = 1500;
/**********************************************
            AI CONTROL CONSTANTS
***********************************************/
//Thrust
const THRUST = 1;
const GLIDE = 0;
//Alt
const CLIMB = 1;
const DROP = 0;
//Yaw
const RIGHT = 1;
const LEFT = 0;
//Lethality
 var LETHALITY_CONDITION = 0; // 0 = Patrol, 1 = Play, 2 = Kill
 const KILL_TIME = 1000;
 /**********************************************
              TARGET CONSTANTS
***********************************************/
const TARGET_SIZE = 30;
const TRACK_SPEED = 10;
const RAISE_SPEED = 8;
const ALTITUDE_THRESHOLD = 100;
/********************************************
          NEURAL NETWORK PARAMETERS
*********************************************/
// STEP 1: 2D TRACKING (STATIC ALTITUDE)
const NUM_INPUTS = 5; //FIGHTER x and y and heading + TARGET x and y
const NUM_HIDDEN = 35; // IDEA: Probably more hidden layers than the AA Gun?
const NUM_OUTPUTS = 2; //FIGHTER thrust, yaw
const NUM_SAMPLES = 1000000; //number of samples
const OUTPUT_THRESHOLD = 0.25; //how close it needs to be to commit to moving
          // NEURAL NETWORK SETUP
var nn;
if(AUTOMATION_ON)
{
  nn = new NeuralNetwork(NUM_INPUTS, NUM_HIDDEN, NUM_OUTPUTS);
  let fx, fy, tx, ty;
  for (let i = 0; i < NUM_SAMPLES; i++){
    // random target positions
    tx = Math.random()*MAX_WIDTH;
    ty = Math.random()*MAX_HEIGHT;
    // random fighter positions
    fx = Math.random()*MAX_WIDTH;
    fy = Math.random()*MAX_HEIGHT;
    // random fighter headings
    fh = Math.random()*360;
    // calculate yaw
    yaw = (findAngle(fh,tx,ty,fx,fy)>0) ?  RIGHT : LEFT;
    thrust = 1;
    // train the neural net
    nn.train(normalizeInput(fx,fy,fh,tx,ty), [yaw,thrust]);
  }
}
/**********************************************
            TRAINING DATA FUNCTIONS
***********************************************/
//THEORY: How to intercept a static target
//1) calculate angle to target (heading - attack angle)
//2)
//Normalize the data for input
function normalizeInput(fighterX, fighterY, fighterH, targetX, targetY){
  // normalize to between 0 and 1
  let input = [];
  input[0] = (fighterX/MAX_WIDTH);
  input[1] = (fighterY/MAX_HEIGHT);
  input[2] = (fighterH/360);
  input[3] = (targetX/MAX_WIDTH);
  input[4] = (targetY/MAX_HEIGHT);
  return input; //return an array of noramlized positions
}
//find the attack angle from the current heading using the attack vector and the current heading
function findAngle(heading,tx,ty,fx,fy){
  //find attack vector
  let vx = tx - fx;
  let vy = ty - fy;
  //find heading 0 vector
  let ax = 0;
  let ay = -2;
  //find the angle between the two vectors
    //find the dot product
  let rx = vx * ax;
  let ry = vy * ay;
  let num = rx + ry;
    //find mags
  mv = Math.sqrt(vx**2 + vy**2);
  ma = Math.sqrt(ax**2 + ay**2);
  //find angle
  angle = Math.acos(num/(mv*ma));
  angle*=(180/Math.PI);
  // make an absolute angle
  if(tx < fx){
    angle = 360 - angle;
  }
  angle = angle - heading;
  if(angle > 180){
    angle = 180 - angle;
  }
  else if(angle< -180){
    angle += 180;
  }
  return angle;
}

/**********************************************
          SIMULATION ENVIRONMENT
***********************************************/
//START ENVIRONMENT
function startEnvironment() {
  environment.start();
}
//ENVIRONMENT VARIABLE
var environment = {
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
/**************************************************************
          UPDATE THE ENVIRONMENT & CONTROL SCHEMA
*****************************************************************/
function updateEnvironment(){
  environment.clear();
  if(fighter.alive || DEV) //fighter alive or developer mode
  {
    if(AUTOMATION_ON)
    {
      //TODO: AI CONTROLS
      let fx = fighter.x;
      let fy = fighter.y;
      let tx = target.x;
      let ty = target.y;
      let heading = fighter.heading;
      let predict = nn.feedForward(normalizeInput(fx,fy,heading,tx,ty)).data[0];
      console.log(predict);
      //make movement (left or right)
      let dLeft = Math.abs(predict[0] - LEFT);
      let dRight = Math.abs(predict[0] - RIGHT);
      let thrust = Math.abs(predict[1] - THRUST);
      //compare to OUTPUT_THRESHOLD
      if(dLeft < OUTPUT_THRESHOLD){fighter.turn(-1);} //turn left
      else if(dRight < OUTPUT_THRESHOLD){fighter.turn(1);} //turn right
      if(thrust < OUTPUT_THRESHOLD){fighter.thrust();} // go
    }else{
      //Manual Controls (num pad)
      if(environment.keys && (environment.keys[104] || environment.keys[87])){  //Thrust (8)
        if(environment.keys && (environment.keys[96] || environment.keys[66])){fighter.burn = true;} //after burner (0)
        fighter.thrust();
        if(environment.keys && (environment.keys[107] || environment.keys[9])){fighter.climb();} //Climb requires thrust (+)
      }
      if(environment.keys && (environment.keys[100] || environment.keys[65])){fighter.turn(-1);} //Turn left (4)
      if(environment.keys && (environment.keys[102] || environment.keys[68])){fighter.turn(1);} //Turn right (6)
      if(environment.keys && (environment.keys[109] || environment.keys[16])){fighter.drop();} //Descend (-)
      if(environment.keys && (environment.keys[101] || environment.keys[83])){fighter.airbrake = true; fighter.drag();} //Brake (5)
    }
    // Target Controls
    if(environment.keys && environment.keys[38]){target.up();}
    if(environment.keys && environment.keys[40]){target.down();}
    if(environment.keys && environment.keys[37]){target.lef();}
    if(environment.keys && environment.keys[39]){target.righ();}
  }
  fighter.newPos(); //calculate the new position
  fighter.update(); //update the HUD in the update function
  target.update();
}
/************************************************************
                        DRAWING
************************************************************/
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
  heading : 0,//for telemetry data
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
        let message = '**__LOW__ALTITUDE__**';
        if(!this.alive){message = '**__SIMULATION__OVER__**';}
        ctx.fillStyle = "black";
        //BOTTOM
        ctx.fillText(message,20,MAX_HEIGHT-20);
        ctx.fillText(message,20,MAX_HEIGHT-60);
        ctx.fillText(message,20,MAX_HEIGHT-100);
        //TOP
        ctx.fillText(message,MAX_WIDTH-220,20);
        ctx.fillText(message,MAX_WIDTH-220,60);
        ctx.fillText(message,MAX_WIDTH-220,100);
      }else if(this.counter > 90)
      {
        this.counter = 0;
      }
      this.counter++;
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
    this.hud(); //Update the HUD with the new data
    this.drag(); //Apply drag force
    this.ground(); //check for collision with ground
  },
  newPos : function(){
    this.theta += this.yaw * Math.PI / 180;
    this.heading += this.yaw; //for telemetry data
    if(this.heading >= 360){this.heading-=360;}
    if(this.heading < 0){this.heading+=360;}
    this.thrx = this.thr * Math.sin(this.theta);
    this.thry = this.thr * Math.cos(this.theta);
    if(Math.abs(this.thrx) > 0){this.momentumx = this.thrx;}
    if(Math.abs(this.thry) > 0){this.momentumy = this.thry;}
    //check gravity v lift
    this.gravity();
    this.alt += this.lift - this.fall;
    //add momentum
    if(Math.sqrt(Math.pow(this.vx,2) + Math.pow(this.vy,2)) < 9.9){
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
  turn : function(dir){
    //change heading of fighter
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
    if(this.alt>0){this.fall += 5;}
    else{this.alt = 0;}
  },
  climb : function() {
    if(this.alt <= MAX_ALT)
    {
      this.lift += 10;
    } else{
      this.alt = MAX_ALT;
    }
  },
  drop : function() {
    this.fall += 10;
  },
  ground : function() {
    //check if fighter is too low
    if(this.alt <= 0 )
    {
      if(!DEV && this.alive){
        this.alive = false;
        console.log('crash');
      }
      this.alt = 0;
      this.momentumx = 0;
      this.momentumy = 0;
    }
  },
  //HUD telemetry indication
  //--------------------------------------------
  hud : function(){
    ctx = environment.context;
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    //update telemetry
    ctx.fillText('x:'+this.x.toFixed().toString()+'  y:'+this.y.toFixed().toString()+'  alt:'+this.alt.toFixed().toString()+'m',20,20);
    ctx.fillText('vx:'+this.vx.toFixed().toString()+'m/s'+'  vy:'+this.vy.toFixed().toString()+'m/s'+'  heading:'+fighter.heading.toFixed().toString()+'°', 20, 60);
    ctx.fillText('thr:'+this.thr.toFixed().toString()+'m/sE2'+'  climb:'+(this.lift-this.fall).toFixed().toString()+ 'm/s'+'  yaw:'+this.yaw.toFixed().toString()+'°',20,100);
    ctx.fillText('mox:'+this.momentumx.toFixed().toString()+'m/s'+'  moy:'+this.momentumy.toFixed().toString()+'m/s',20,140);
    var brake;
    if (this.airbrake){brake = 'engaged';}else{brake = 'disengaged';}this.airbrake = false;
    ctx.fillText('RB: '+brake,20,180);
    if(this.burn){ctx.fillText('burner: engaged',100,180);}else{ctx.fillText('burner: disengaged',100,180);}this.burn = false;
    ctx.beginPath();
    ctx.rect(10, 10, 230, 220);
    ctx.stroke();
  }
}
/**********************************************************
                      TARGET CLASS
***********************************************************/
var target = {
  x : MAX_WIDTH,
  y : 20,
  z : 0,
  update : function() {
    //check boundaries to loop
    if(this.x > MAX_WIDTH){this.x = 0;}
    if(this.x < 0){this.x = MAX_WIDTH;}
    if(this.y > MAX_HEIGHT){this.y = 0;}
    if(this.y < 0){this.y = MAX_HEIGHT;}
    this.drawTarget();
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
      if(Math.abs(fighter.alt - this.z) >= ALTITUDE_THRESHOLD){
        ctx.strokeStyle = "gray";
      }
      else{
        ctx.strokeStyle = "#FF0000";
      }
      ctx.beginPath();
      ctx.arc(this.x,this.y, TARGET_SIZE, 0.5*Math.PI, 2.5 * Math.PI);
      ctx.stroke();
    }
  }
