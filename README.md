# SYMBIOTIC TACTICAL ARTIFICIAL INTELLIGENCE MODULE - RECONNAISSANCE #

## UNIVERSAL, NON-INVASIVE SCOUTING AI TO TURN COTS RCVS INTO AUXS ##
----------------------------------------------
## PHASE I ##
  __EXPERIMENTATION & ENVIRONMENT__

### STAGE 1 ###
  __fighter.html__

  __simulation.js__

Anti Aircraft Gun V Human Fighter
* Develop components (Target, Environment, Fighter, HUD)
* Organize the simulation environment (loop edges, altitudes, warnings)
----------------------------------------------------
### STAGE 2 ###
  __simulation.js__

  __neural-net.js__

AI Anti Aircraft Gun 2D
* Experiment with Neural Networks (inputs, hidden layers, outputs)
* Matrix functions
* Basic 2D training
----------------------------------------------------
### STAGE 3 ###
  __simulation.js__

AI Anti Aircraft Gun 3D
* Expand neural net (6 inputs, 3 outputs)
* 3D training
* Adjust target colors for 3D feedback
----------------------------------------------------
### STAGE 4 ###
  __simpilot.js__

AI Fighter Pilot (BASIC)
* Revise neural net (5 inputs [target 2D position, fighter 2d position, fighter heading], 2 output [yaw, thrust])
* 2D training sets
* Redo fighter controls for Autonomy
* Update environment constants
----------------------------------------------------------------
### STAGE 5 ###
  __aiFighter.js__

AI Fighter Pilot (ADVANCED)
* Updated  neural nets (1 for yaw and thrust && 1 for climb)
* 3D training sets
* Update fighter controls for climb and drop
----------------------------------------------------------------
### STAGE 5B ###
  __aif.js__

AI Fighter Pilot (ADVANCED)
* Condensed neural net (yaw, thrust, climb)
* 3D training sets
* Update fighter controls for climb and drop
----------------------------------------------------------------
## PHASE II ##

  __PROTOTYPE AI__

### STAGE 1 ###

Stand-alone AI for simulated environment (API pulls environment data)

* Neural Net on Python on RPi
* Create JS Simulation Environment
* Create JS Simulated RCV
  * Car
  * QuadCopter
  * Wing
* Create JS Environment Interfaces
