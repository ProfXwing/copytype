# copytype

This is essentially a re-write of monkeytype, made for typing e-books. Thank you Miodec for allowing me to upload this project, and for everything you do for the typing community. It saves your place when you quit the app, as well as your typing stats (wpm, acc, etc.). I've included Great Expectations as an epub in each of the zip files, so you don't need anything else to try it out except to download it.

# Installation

Head to https://github.com/ProfXwing/copytype/releases, and grab the latest version for your platform. There should be a guide to which zip you should download in the release description. After installation, you should just be able to run it directly. You'll probably want to move the app to an applications folder, of course!


<img src="https://user-images.githubusercontent.com/50530928/178306716-9073aa38-4f92-43b4-aaca-70545d8a425d.png" alt="drawing" width="600"/>
<img src="https://user-images.githubusercontent.com/50530928/178306743-9f2ad49e-2d85-4eea-89b7-e338787a057b.png" alt="drawing" width="600"/>


# Dev Setup

Note: this is not for an everyday user. For everyday users, read Installation above.

Here's a quick guide to setup a development environment:

First, install node https://nodejs.org/en/download/

Setup should be fairly straight forward. 
First, clone using `git clone https://github.com/ProfXwing/copytype.git`
Next, change into the copytype directory. (`cd copytype`)
Initialize node_modules using `npm i`
Start the app using `npm start`

There you go!

Changes made in the rendering process will be loaded when you reload the window. 
Changes made in the main process need the app to be restarted completely, as far as I know.

You can make issues or pull requests, anything would help! :)
