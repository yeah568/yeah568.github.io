---
categories:
- code


short: nextbus
title: Next Bus
desc: A webapp that helps you find brony conventions near you.

links:
  - link: http://yeah568.github.io/confinder
    linktext: Confinder >>
  - link: https://github.com/yeah568/confinder
    linktext: GitHub >>

tech:
- android
- translink
- svn
---
2014-07-01-
Developed over the course of a few days in the summer of 2014, Confinder is a simple client-side Angular application that lets you find conventions near you.

Based on AngularJS, Confinder utilizes the HTML5 Geolocation API (with a Google Maps based geocoder as a fallback) to calculate the distance between you and a wide variety of cons. Convention data is stored in a simple JSON file, and is served to and rendered on the client.