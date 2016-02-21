---
categories:
- code

bgcolour: d35400
bordercolour: A14000
faicon: map-marker

short: pickaplace
title: PickAPlaceFor.Us
desc: Food is good. Indecision is bad. Let us help.

links:
  - url: https://github.com/yeah568/foodvote
    text: Client code >>
  - url: https://github.com/yeah568/foodvote-server
    text: Server code >>

gallery:
  - url: 1.png
    text: Upon launching the app, you can enter your name and create a lobby.
  - url: 2.png
    text: The creator then gets to choose a starting point for everyone to meet.
  - url: 3.png
    text: They finally pick a maximum distance from that point they want to go, and then can start the voting from the lobby.
  - url: 4.png
    text: The overall logo, colour palette, and font choices that I designed.
  - url: 5.png
    text: A promotional image used at our expo table.

tech:
- JavaScript
- Java
- Android
- Node.js
- Socket.IO
- Google Maps API
- Yelp API
- Heroku
- GitHub
---
Developed over the course of 36 hours at nwHacks 2015, PickAPlaceFor.Us helps those of us who can't decide where to go to eat when you're out with friends (aka, all of us). Inspired by the Gale-Shapley algorithm, we automagically determine the most optimal location for the group to go.

A user begins by creating a lobby for the group, choosing a location to meet, and a radius to search for restaurants in. Once everyone has joined the lobby, the voting begins. Each round pits one restaurant against the other, with a sliding scale to determine how much each person prefers one place to another. The winner of each round then gets pitted against the next, until only one remains: the winner.

I was responsible for graphic design for the app, creating a unique brand identity, implementing parts of the realtime communication on the server end, as well as many of the screens of the Android app, including the lobby, voting screens, and the results screen. I was also one of the main presenters for the app at the hackathon expo, demonstrating the app to judges and other hackers alike.

On the backend, we're running a Node.js server on Heroku, with Socket.IO to establish realtime communication between clients. The app also features integration with the Google Maps and Yelp APIs, by pulling in restaurant suggestions around locations suggested by the host, which are then voted on.

Developed with [Jonathan Lui](https://github.com/kinwa91), [Mike Park](http://mikeparkms.com/), [Shikib Mehri](http://shikib.ca) and [William Qi](http://williamqi.com).