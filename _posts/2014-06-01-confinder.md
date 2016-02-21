---
categories:
- code


short: confinder
title: Confinder
desc: A webapp that helps you find brony conventions near you.

links:
  - url: http://yeah568.github.io/confinder
    text: Confinder >>
  - url: https://github.com/yeah568/confinder
    text: Code >>

gallery:
  - url: 1.png
    text: Confinder provides a simple map and information about various conventions around the world, including dates, location, the website, and distance from where you are.
  - url: 2.png
    text: It even works when you're in the middle of nowhere, Lilooet, British Columbia, Canada!

tech:
- JavaScript
- HTML5
- AngularJS
- Google Maps API
- Bootstrap
- Grunt
- GitHub
---
Developed over the course of a few days in the summer of 2014, Confinder is a simple client-side Angular application that lets you find conventions near you.

Based on AngularJS, Confinder utilizes the HTML5 Geolocation API (with a Google Maps based geocoder as a fallback) to calculate the distance between you and a wide variety of cons. Convention data is stored in a simple JSON file, and is served to and rendered on the client.