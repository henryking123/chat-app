const express = require("express")
const path = require("path")
const http = require("http")
const socketio = require("socket.io")
const Filter = require("bad-words")
const { generateMessage, generateLocationMessage } = require("./utils/messages")
const { addUser, getUser, getUsersInRoom, removeUser } = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDir = path.join(__dirname, "../public")
app.use(express.static(publicDir))

io.on("connection", socket => {
	socket.on("join", ({ username, room }, callback) => {
		const { user, error } = addUser({ id: socket.id, username, room })

		if (error) return callback(error)

		socket.join(room)
		socket.emit("message", generateMessage("Admin", "Welcome!"))

		socket.broadcast
			.to(user.room)
			.emit("message", generateMessage("Admin", `${user.username} has joined.`))

		io.to(user.room).emit("roomData", {
			room: user.room,
			users: getUsersInRoom(user.room)
		})
		callback()
	})

	socket.on("sendMessage", (message, callback) => {
		const user = getUser(socket.id)
		const filter = new Filter()
		if (filter.isProfane(message)) return callback("Profanity is not allowed.")

		io.to(user.room).emit("message", generateMessage(user.username, message))
		callback()
	})

	socket.on("disconnect", () => {
		const user = removeUser(socket.id)
		if (user) {
			io.to(user.room).emit("message", generateMessage("Admin", `${user.username} has left.`))

			io.to(user.room).emit("roomData", {
				room: user.room,
				users: getUsersInRoom(user.room)
			})
		}
	})

	socket.on("sendLocation", ({ latitude, longitude }, callback) => {
		const user = getUser(socket.id)
		io.to(user.room).emit(
			"locationMessage",
			generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`)
		)
		callback()
	})
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server started on port ${PORT}`))
