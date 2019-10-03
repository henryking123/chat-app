// DOM Elements
const $messages = document.querySelector("#messages")
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = document.querySelector("#message")
const $messageFormButton = document.querySelector("button")
const $sendLocation = document.querySelector("#send-location")
const $sideBar = document.querySelector("#sidebar")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// DOM related JS
const autoscroll = () => {
	// New message element
	const $newMessage = $messages.lastElementChild

	// Height of the new message
	const newMessageStyles = getComputedStyle($newMessage)
	const newMessageMargin = parseInt(newMessageStyles.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

	// Visible height
	const visibleHeight = $messages.offsetHeight

	// Height of messages container
	const containerHeight = $messages.scrollHeight

	// How far have I scrolled?
	const scrollOffset = $messages.scrollTop + visibleHeight

	if (containerHeight - newMessageHeight <= scrollOffset) $messages.scrollTop = containerHeight
}

const socket = io()

socket.on("message", message => {
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format("h:mm a")
	})
	$messages.insertAdjacentHTML("beforeend", html)
	autoscroll()
})

$messageForm.addEventListener("submit", e => {
	e.preventDefault()
	// Disabling button when sending
	$messageFormButton.setAttribute("disabled", "disabled")
	socket.emit("sendMessage", e.target.elements.message.value, error => {
		// Enabling the button back & Resetting form input
		$messageFormButton.removeAttribute("disabled")
		$messageFormInput.value = ""
		$messageFormInput.focus()

		if (error) return alert(error)
	})
})

$sendLocation.addEventListener("click", () => {
	if (!navigator.geolocation) alert("Geolocation is not supported by browser")

	// Disable the button
	$sendLocation.setAttribute("disabled", "disabled")
	navigator.geolocation.getCurrentPosition(position => {
		const { latitude, longitude } = position.coords

		socket.emit("sendLocation", { latitude, longitude }, () => {
			$sendLocation.removeAttribute("disabled")
			console.log("Location shared")
		})
	})
})

socket.on("locationMessage", message => {
	const html = Mustache.render(locationTemplate, {
		username: message.username,
		url: message.text,
		createdAt: moment(message.createdAt).format("h:mm a")
	})
	$messages.insertAdjacentHTML("beforeend", html)
	autoscroll()
})

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })
socket.emit("join", { username, room }, error => {
	if (error) {
		alert(error)
		location.href = "/"
	}
})

socket.on("roomData", ({ users, room }) => {
	const html = Mustache.render(sidebarTemplate, { room, users })
	$sideBar.innerHTML = html
})
