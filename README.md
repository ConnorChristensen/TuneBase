# TuneBase
An app for tracking data from iTunes over time.

## Getting started
When the app first opens up, a file browser will pop up.
Use that browser to select the file *iTunes Library.xml*.
This is where iTunes keeps its data on the music in your library.

After you select the file, it will not ask for it again.

Since the app is not focused on running quickly, please be patient while
it extracts all the information from the iTunes library.
The time it takes to load depends on the size of your iTunes Library.
For me, the few thousand songs I have takes the app about 8 seconds to load.

After it extracts the information from the iTunes Library, it will store it in
a database.
The app loads almost instantly when pulling information from the database.

## Data Storage
* The app will not damage any information on your iTunes Library, as it only 
reads from the file.
* There is no guarantee that the data will be maintained through the different
versions of this software.
* This app will never collect any of your information, the app does not need an
internet connection to run.
