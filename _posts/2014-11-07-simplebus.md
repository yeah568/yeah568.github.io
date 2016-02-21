---
categories:
- code


bgcolour: 0098B3
bordercolour: 006D80
faicon: bus

short: simplebus
title: SimpleBus
desc: When the buses you care about are arriving. That's it.

links:
  - url: http://jamesliu.ca/simplebus
    text: SimpleBus >>
  - url: https://github.com/yeah568/simplebus
    text: Client code >>
  - url: https://github.com/yeah568/simplebus-server
    text: Server code >>

gallery:
  - url: main.png
    text: The main SimpleBus interface.

tech:
- JavaScript
- Python
- HTML5
- AngularJS
- Flask
- JQuery UI
- Grunt
- Heroku
- GitHub
---
Living in Metro Vancouver, I rely on Translink's services to get me around. While various mobile apps and the Next Bus service exist, they all either require you to enter a stop number every time, or show all the buses that are nearby. I always wanted something that just showed me the buses at the stops that I cared about, so I made it. SimpleBus lets you get when the next bus leaves at a glance, for all your favourite buses.

Using AngularJS, I developed the front end to use HTML5 Local Storage to save the user's settings, as well as jQuery UI to enable some more interactivity with the page.

The server is a very simple server written in Python with Flask. Essentially, it acts as a proxy for the client - Translink's API doesn't have the correct CORS headers to allow for a client to use it dirThus, the server takes the Translink API, and applies the correct headers before passing it to the client. Currently, the main SimpleBus server is hosted on Heroku, however, it can be easily hosted anywhere else that supports Python.