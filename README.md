# TuneBase
An app for tracking data from iTunes over time.

The purpose of this app is not to be fast, or to be used for anything other than
entertainment, so please be patient with it.
This application is supposed to be an easy way to get fun information to both
Mac and Windows users, and it does that job well.

## Design

The application is designed to be visually pleasing, present the data in a clear way, and be easy for users to navigate.
The application may take some time to match this design, but we will be working to make the app look as close as possible to the design.

![alt text](images/home.png)

![alt text](images/play_count.png)

![alt text](images/settings.png)

## Getting started
When the app first opens up, a file browser will pop up.
Use that browser to select the file **iTunes Library.xml**.
For locating the iTunes Library file, please consult the iTunes Library section

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


## iTunes Library
Apple makes a nice and reliable operating system, but because they don't need to
work with anyone else, all the stuff going on behind the scenes are confusing.

iTunes keeps a proprietary **itl** file called **iTunes Library.itl**.
This file is not human readable, and it is very difficult to interact with it.
This is what iTunes uses to read and write organization data so it knows what to
do when it starts up.
Some developers want to access that information, so Apple created a little
checkbox for the users to generate a separate XML file.

If you can't find the iTunes Library.xml file, go into iTunes settings and
check the box in the advanced pane that says "Share iTunes Library XML with
other applications"
![alt text](images/generate_itunes_xml.png)
