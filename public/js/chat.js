// DOM elements
const $messageForm = document.querySelector('#chatform');
const $messageInput = $messageForm.querySelector('#chatmessage');
const $messageButton = $messageForm.querySelector('#chatbutton');
const $locButton = document.querySelector('#share-loc');
const $messages = document.querySelector('#messages');

// Templates
const chatTemplate = document.querySelector('#chat-template').innerHTML;
const urlTemplate = document.querySelector('#url-template').innerHTML;
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options

// Use Qs.js loaded as a script using the script tag in chat.html
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true});  // to parse a query string

// logic for autoscroll
const autoscroll = () => {
    // New message element 
    const $newMessage = $messages.lastElementChild
    // Compute the height of the new message

    // get the margin value
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)

    // compute the message height
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of message container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

// to connect to the websocket server
const socket = io();

// we can send and receive events using the socket

// message listeners:  server --> client
socket.on('message', (messageFromServer) => {
    console.log(messageFromServer)
    // use Mustache to render the template. The data to be used is passed as a JS object of key-value pairs.
    // The key is the variable name used in the script template in the index.html
    const html = Mustache.render(chatTemplate, {
        username: messageFromServer.username,
        message: messageFromServer.text,
        // used momentjs to format the date. refer: https://momentjs.com/
        at: moment(messageFromServer.createdAt).format('h:mm a')
    })
    // insert the template on the $messages div
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
});

socket.on('locationMessage', (urlFromServer) => {
    console.log(urlFromServer)
    const html = Mustache.render(urlTemplate, {
        username: urlFromServer.username,
        url: urlFromServer.url,
        at: moment(urlFromServer.createdAt).format('h:mm a')
    })
    // insert the template on the $messages div
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sideBarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
});


// message emitters: client --> server

// Handles the chat message typed on the client and emits the message back to the server
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // Disable button when message is being send to server
    $messageButton.setAttribute('disabled', 'disabled')
    // emit as event for the server to receive
    socket.emit('sendMessage', $messageInput.value, (error) => {
        // Enable button and focus on input box when message sending completes and acknowledgement
        // is received.
        $messageButton.removeAttribute('disabled')
        $messageInput.value = ''
        $messageInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
});

// A click event handler which enables an user to share her location with other users in the chat app
// Uses a callback for event acknowledgement. Checks for error and prints success message to console otherwise
$locButton.addEventListener('click', () => {
    // old browsers might not support
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        // disable button while emitting message
        $locButton.setAttribute('disabled', 'disabled')
        // emit as event for the server to receive
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (error) => {

            // enable button when message emitted and acknowledgement received from server
            $locButton.removeAttribute('disabled')

            if (error) return console.log(error)
            
            console.log('Location shared!')
        })
    })
});

// Emit a message to the chat server with the object { username, room }
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        // and redirect to root of website
        location.href = '/'
    }
});