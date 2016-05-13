/*

  webrtc_polyfill.js by Rob Manson (buildAR.com)
  NOTE: Based on adapter.js by Adam Barth
        See http://www.webrtc.org/interop for more info

  The MIT License

  Copyright (c) 2013 Rob Manson, http://buildAR.com. All rights reserved.

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.

*/

var webrtc_capable = true;
var rtc_peer_connection = null;
var rtc_session_description = null;
var rtc_ice_candidate = null
var get_user_media = null;
var connect_stream_to_src = null;
var stun_server = "stun.l.google.com:19302";

if (navigator.getUserMedia) { // WebRTC 1.0 standard compliant browser
  rtc_peer_connection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
  rtc_session_description = RTCSessionDescription;
  rtc_ice_candidate = RTCIceCandidate;
  get_user_media = navigator.getUserMedia.bind(navigator);
  connect_stream_to_src = function(media_stream, media_element) {
    // https://www.w3.org/Bugs/Public/show_bug.cgi?id=21606
    media_element.srcObject = media_stream;
    media_element.play();
  };
} else if (navigator.mozGetUserMedia) { // early firefox webrtc implementation
  rtc_peer_connection = mozRTCPeerConnection;
  rtc_session_description = mozRTCSessionDescription;
  rtc_ice_candidate = mozRTCIceCandidate;
  get_user_media = navigator.mozGetUserMedia.bind(navigator);
  connect_stream_to_src = function(media_stream, media_element) {
    media_element.mozSrcObject = media_stream;
    media_element.play();
  };
  stun_server = "23.21.150.121"; // Mozilla's STUN server
} else if (navigator.webkitGetUserMedia) { // early webkit webrtc implementation
  rtc_peer_connection = webkitRTCPeerConnection;
  rtc_session_description = RTCSessionDescription;
  rtc_ice_candidate = RTCIceCandidate;
  get_user_media = navigator.webkitGetUserMedia.bind(navigator);
  connect_stream_to_src = function(media_stream, media_element) {
    media_element.src = webkitURL.createObjectURL(media_stream);
    media_element.play();
  };
} else {
  alert("This browser does not support WebRTC - visit WebRTC.org for more info");
  webrtc_capable = false;
}