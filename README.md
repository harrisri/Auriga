# Auriga
Tower Defense Game for CS467

# USAGE INSTRUCTIONS
The easiest way to begin playing our game is to simply go to the following link: https://harrisri.github.io/Auriga/. 

If you would like to view the source code and run the game locally, take the following steps:
  1) Clone the repository with: `git clone https://github.com/harrisri/Auriga`
  2) Ensure Node.js is installed on your computer.  If not, download from their website here: https://nodejs.org/en/download/ 
  3) Install http-server with: `npm install http-server -g`
    -This installs http-server globally so that it may be run from the command line.
  4) Navigate into the Auriga folder
  5) Run the local server with: `http-server -c-1`
    -The `-c-1` option disables caching on the browser 
  6) Go to `localhost:8080` in Google Chrome browser.
  
# CONTROLS
The controls for our game are very simple.  Simply click on a tower on the right hand side of the screen and place it on any buildable space (denoted by green squares on the map).  When a tower is clicked on, a tower sprite will follow your mouse as well as a range indicator for that tower. If you have enough money, the tower will be placed on the selected space (to cancel out of placing a tower, simply hit ESC on your keyboard).  Hovering the mouse over a tower will also show its current range. In order to upgrade or sell a placed tower, click on the tower and select the corresponding button.  Hovering the mouse over the upgrade button will show the potential stat increase as well as an upgraded range indicator.  A successful upgrade will be denoted by an additional star below the tower.  

