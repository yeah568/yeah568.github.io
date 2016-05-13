/*

  video_call_with_chat_and_file_sharing.js by Rob Manson (buildAR.com)

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

var call_token; // unique token for this call
var signaling_server; // signaling server for this call
var peer_connection; // peer connection object
var file_store = []; // shared file storage
var local_stream_added = false;

function start() {
  var recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = function() { console.log('start'); }
  recognition.onresult = function(event) { console.log(event); }
  recognition.onerror = function(event) { console.log(event); }
  recognition.onend = function() { cosole.log('end'); }
  
  recognition.lang = 'en-US';
  recognition.start();  
    
  // create the WebRTC peer connection object
  peer_connection = new rtc_peer_connection({ // RTCPeerConnection configuration 
    "iceServers": [ // information about ice servers
      { "url": "stun:"+stun_server }, // stun server info
    ]
  });

  // generic handler that sends any ice candidates to the other peer
  peer_connection.onicecandidate = function (ice_event) {
    console.log("new ice candidate");
    if (ice_event.candidate) {
      signaling_server.send(
        JSON.stringify({
          token:call_token,
          type: "new_ice_candidate",
          candidate: ice_event.candidate ,
        })
      );
    }
  };

  // display remote video streams when they arrive using remote_video <video> MediaElement
  peer_connection.onaddstream = function (event) {
    console.log("new remote stream added");
    connect_stream_to_src(event.stream, document.getElementById("remote_video"));
    // hide placeholder and show remote video
    document.getElementById("loading_state").style.display = "none";
    console.log("updating UI to open_call_state");
    document.getElementById("open_call_state").style.display = "block";
  };

  // setup stream from the local camera 
  setup_video();

  // setup generic connection to the signaling server using the WebSocket API
  console.log("setting up connection to signaling server");
  signaling_server = new WebSocket("ws://localhost:3000");

  if (document.location.hash === "" || document.location.hash === undefined) { // you are the Caller
    console.log("you are the Caller");

    // create the unique token for this call 
    var token = Date.now()+"-"+Math.round(Math.random()*10000);
    call_token = "#"+token;

    // set location.hash to the unique token for this call
    document.location.hash = token;

    signaling_server.onopen = function() {
      // setup caller signal handler
      signaling_server.onmessage = caller_signal_handler;

      // tell the signaling server you have joined the call 
      console.log("sending 'join' signal for call token:"+call_token);
      signaling_server.send(
        JSON.stringify({ 
          token:call_token,
          type:"join",
        })
      );
    }

    document.title = "You are the Caller";
    console.log("updating UI to loading_state");
    document.getElementById("loading_state").innerHTML = "Ready for a call...ask your friend to visit:<br/><br/>"+document.location;

  } else { // you have a hash fragment so you must be the Callee 
    console.log("you are the Callee");
    
    // get the unique token for this call from location.hash
    call_token = document.location.hash;

    signaling_server.onopen = function() {
      // setup caller signal handler
      signaling_server.onmessage = callee_signal_handler;

      // tell the signaling server you have joined the call 
      console.log("sending 'join' signal for call token:"+call_token);
      signaling_server.send(
        JSON.stringify({ 
          token:call_token,
          type:"join",
        })
      );

      // let the caller know you have arrived so they can start the call
      console.log("sending 'callee_arrived' signal for call token:"+call_token);
      signaling_server.send(
        JSON.stringify({ 
          token:call_token,
          type:"callee_arrived",
        })
      );
    }

    document.title = "You are the Callee";
    console.log("updating UI to loading_state");
    document.getElementById("loading_state").innerHTML = "One moment please...connecting your call...";
  }

  // setup message bar handlers
  document.getElementById("message_input").onkeydown = send_chat_message;
  document.getElementById("message_input").onfocus = function() { this.value = ""; }

  // setup file sharing 
  if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
    document.getElementById("file_sharing").style.display = "none";
    alert("This browser does not support File Sharing");
  } else {
    document.getElementById("file_add").onclick = click_file_input;
    document.getElementById("file_input").addEventListener("change", file_input, false);
    document.getElementById("open_call_state").addEventListener("dragover", drag_over, false);
    document.getElementById("open_call_state").addEventListener("drop", file_input, false);
  }
}

/* functions used above are defined below */

// handler to process new descriptions
function new_description_created(description) {
  peer_connection.setLocalDescription(
    description, 
    function () {
      signaling_server.send(
        JSON.stringify({
          token:call_token,
          type:"new_description",
          sdp:description 
        })
      );
    }, 
    log_error
  );
}

// handle signals as a caller
function caller_signal_handler(event) {
  var signal = JSON.parse(event.data);
  console.log(signal.type);
  if (signal.type === "callee_arrived") {
    create_offer();
  } else if (signal.type === "new_ice_candidate") {
    peer_connection.addIceCandidate(
      new rtc_ice_candidate(signal.candidate)
    );
  } else if (signal.type === "new_description") {
    peer_connection.setRemoteDescription(
      new rtc_session_description(signal.sdp), 
      function () {
        if (peer_connection.remoteDescription.type == "answer") {
          // extend with your own custom answer handling here
        }
      },
      log_error
    );
  } else if (signal.type === "new_chat_message") {
    add_chat_message(signal);
  } else if (signal.type === "new_file_thumbnail_part") {
    store_file_part("thumbnail", signal.id, signal.part, signal.length, signal.data);
    if (file_store[signal.id].thumbnail.parts.length == signal.length) {
      document.getElementById("file_list").innerHTML = get_file_div(signal.id)+document.getElementById("file_list").innerHTML;
      document.getElementById("file-img-"+signal.id).src = file_store[signal.id].thumbnail.parts.join(""); 
    }
  } else if (signal.type === "new_file_part") {
    store_file_part("file", signal.id, signal.part, signal.length, signal.data);
    update_file_progress(signal.id, file_store[signal.id].file.parts.length, signal.length);
  } else if (signal.type === "new_sentiment_score") {
    update_sentiment_score(signal);
  } else {
    // extend with your own signal types here
  }
}
function create_offer() {
  if (local_stream_added) {
    console.log("creating offer");
    peer_connection.createOffer(
      new_description_created, 
      log_error
    );
  } else {
    console.log("local stream has not been added yet - delaying creating offer");
    setTimeout(function() {
      create_offer();
    }, 1000);
  }
}

// handle signals as a callee
function callee_signal_handler(event) {
  var signal = JSON.parse(event.data);
  console.log(signal.type);
  if (signal.type === "new_ice_candidate") {
    peer_connection.addIceCandidate(
      new rtc_ice_candidate(signal.candidate)
    );
  } else if (signal.type === "new_description") {
    peer_connection.setRemoteDescription(
      new rtc_session_description(signal.sdp), 
      function () {
        if (peer_connection.remoteDescription.type == "offer") {
          create_answer();
        }
      },
      log_error
    );
  } else if (signal.type === "new_chat_message") {
    add_chat_message(signal);
  } else if (signal.type === "new_file_thumbnail_part") {
    store_file_part("thumbnail", signal.id, signal.part, signal.length, signal.data);
    if (file_store[signal.id].thumbnail.parts.length == signal.length) {
      document.getElementById("file_list").innerHTML = get_file_div(signal.id)+document.getElementById("file_list").innerHTML;
      document.getElementById("file-img-"+signal.id).src = file_store[signal.id].thumbnail.parts.join(""); 
    }
  } else if (signal.type === "new_file_part") {
    store_file_part("file", signal.id, signal.part, signal.length, signal.data);
    update_file_progress(signal.id, file_store[signal.id].file.parts.length, signal.length);
  } else if (signal.type === "new_sentiment_score") {
    update_sentiment_score(signal);
  } else {
    // extend with your own signal types here
  }
}
function create_answer() {
  if (local_stream_added) {
    console.log("creating answer");
    peer_connection.createAnswer(new_description_created, log_error);
  } else {
    console.log("local stream has not been added yet - delaying creating answer");
    setTimeout(function() {
      create_answer();
    }, 1000);
  }
}

// add new chat message to messages list
function add_chat_message(signal) {
  var messages = document.getElementById("messages");
  var user = signal.user || "them"; 
  messages.innerHTML = user+": "+signal.message+"<br/>\n"+messages.innerHTML;
}

// send new chat message to the other browser
function send_chat_message(e) {
  if (e.keyCode == 13) {
    var new_message = this.value;
    this.value = ""; 
    signaling_server.send(
      JSON.stringify({
        token:call_token,
        type: "new_chat_message",
        message: new_message 
      })
    );
    add_chat_message({ user: "you", message: new_message }); 
  }
}

// sends string to server to get sentiment score
function getSentimentScore(string, callback){
  var string = encodeURI(string);
  var baseURL = "http://localhost:3000/getSentiment";
  var url = baseURL + "/" + string;
  url = encodeURI(url);
  console.log(url);
  var score = null;
  return $.ajax(url, {
    success: function(result){
      score = result;
      console.log(result);
      callback(null, result);
    },
    error: function(err) {
      callback(err, null);
      alert(JSON.stringify(err));
    }
  }); 
}

// callback function to be able to access generated score
function getScoreCallback(string){
  getSentimentScore(string, function(err, result){
    if (err){
      console.log("Error!");
      res.json(err);
    }
    console.log("Sentiment score: " + result);
    send_sentiment_score(result);
  });
}

// update current sentiment score to reflect latest value
function update_sentiment_score(signal) {
  var score = signal.score;
  // handle new score below
}

// send latest sentiment score to the other browser
function send_sentiment_score(score) {
  signaling_server.send(
    JSON.stringify({
      token:call_token,
      type: "new_sentiment_score",
      score: score
    })
  );
}

// setup stream from the local camera 
function setup_video() {
  console.log("setting up local video stream");
  get_user_media(
    { 
      "audio": true, // request access to local microphone
      "video": true  // request access to local camera
    }, 
    function (local_stream) { // success callback
      // display preview from the local camera & microphone using local <video> MediaElement
      console.log("new local stream added");
      connect_stream_to_src(local_stream, document.getElementById("local_video"));
      // mute local video to prevent feedback
      document.getElementById("local_video").muted = true;
      // add local camera stream to peer_connection ready to be sent to the remote peer
      console.log("local stream added to peer_connection to send to remote peer");
      peer_connection.addStream(local_stream);
      local_stream_added = true;
    },
    log_error
  );
}

// file sharing html template 
function get_file_div(id) {
  return '<div id="file-'+id+'" class="file"><img class="file_img" id="file-img-'+id+'" onclick="display_file(event)" src="images/new_file_arriving.png" /><div id="file-progress-'+id+'" class="file_progress"></div></div>';
}

// initiate manual file selection
function click_file_input(event) {
  document.getElementById('file_input').click();
}

// prevent window from reloading when file dragged into it
function drag_over(event) {
  event.stopPropagation();
  event.preventDefault();
}

// handle manual file selection or drop event
function file_input(event) {
  event.stopPropagation();
  event.preventDefault();
  var files = undefined;
  if (event.dataTransfer && event.dataTransfer.files !== undefined) {
    files = event.dataTransfer.files;
  } else if (event.target && event.target.files !== undefined) {
    files = event.target.files;
  }
  if (files.length > 1) {
    alert("Please only select one file at a time");
  } else if (!files[0].type.match('image.*')) {
    alert("This demo only supports sharing image files");
  } else if (files.length == 1) {
    var kb = (files[0].size/1024).toFixed(1);
    var new_message = "Sending file...<br><strong>"+files[0].name+"</strong> ("+kb+"KB)";
    signaling_server.send(
      JSON.stringify({
        token:call_token,
        type: "new_chat_message",
        message: new_message 
      })
    );
    add_chat_message({ user: "you", message: new_message });
    document.getElementById("file_list").innerHTML = get_file_div(file_store.length)+document.getElementById("file_list").innerHTML;
    var reader = new FileReader();
    reader.onload = (function(file, id) {
      return function(event) {
        send_file(file.name, id, event.target.result); 
      }
    })(files[0], file_store.length);
    reader.readAsDataURL(files[0]);
  }
}

// send selected file
function send_file(name, file_id, data) {
  var default_width = 160;
  var default_height = 120;
  var img = document.getElementById("file_img_src");
  img.onload = function() {
    var image_width = this.width;
    var target_width = default_width;
    var image_height = this.height;
    var target_height = default_height;
    var top = 0;
    var left = 0;
    if (image_width > image_height) {
      var ratio = target_width/image_width;
      target_height = image_height*ratio;
      top = (default_height-target_height)/2;
    } else if (image_height > image_width) {
      var ratio = target_height/image_height;
      target_width = image_width*ratio;
      left = (default_width-target_width)/2;
    } else {
      left = (default_width-default_height)/2;
      target_width = target_height;
    }
    var canvas = document.getElementById("file_thumbnail_canvas");
    canvas.width = default_width;
    canvas.height = default_height;
    var cc = canvas.getContext("2d");
    cc.clearRect(0,0,default_width,default_height);
    cc.drawImage(img, left, top, target_width, target_height);
    var thumbnail_data = canvas.toDataURL("image/png");
    document.getElementById("file-img-"+file_id).src = thumbnail_data; 
    send_file_parts("thumbnail", file_id, thumbnail_data);
    send_file_parts("file", file_id, data);
  }
  img.src = data;  
}

// break file into parts and send each of them separately 
function send_file_parts(type, id, data) {
  var message_type = "new_file_part";
  if (type == "thumbnail") {
    message_type = "new_file_thumbnail_part";
  }
  var slice_size = 1024;
  var parts = data.length/slice_size;
  if (parts % 1 > 0) {
    parts = Math.round(parts)+1;
  }
  for (var i = 0; i < parts; i++) { 
    var from = i*slice_size;
    var to = from+slice_size;
    var data_slice = data.slice(from, to);
    store_file_part(type, id, i, parts, data_slice);
    signaling_server.send(
      JSON.stringify({
        token:call_token,
        type: message_type, 
        id: id,
        part: i,
        length: parts,
        data: data_slice 
      })
    );
  }
}

// store individual file parts in the local file store
function store_file_part(type, id, part, length, data) {
  if (file_store[id] === undefined) {
    file_store[id] = {};
  }
  if (file_store[id][type] === undefined) {
    file_store[id][type] = {
      parts: []
    };
  }
  if (file_store[id][type].length === undefined) {
    file_store[id][type].length = length;
  }
  file_store[id][type].parts[part] = data;
}

// show the progress of a file transfer
function update_file_progress(id, parts, length) {
  var percentage = Math.round((parts/length)*100);
  if (percentage < 100) {
    document.getElementById("file-progress-"+id).innerHTML = percentage+"%";
    document.getElementById("file-img-"+id).style.opacity = 0.25;
  } else {
    document.getElementById("file-progress-"+id).innerHTML = "";
    document.getElementById("file-img-"+id).style.opacity = 1;
  }
}

// show the full file
function display_file(event) {
  var match = event.target.id.match("file-img-(.*)");
  var file = file_store[match[1]].file;
  if (file.parts.length < file.length) {
    alert("Please wait - file still transfering");
  } else { 
    window.open(file.parts.join(""));
  }
}

// generic error handler
function log_error(error) {
  console.log(error);
}
