const MESSAGE_SEND = 0;
const MESSAGE_REPLY = 1;

class OutputBuffer {

	constructor(response) {
		this.response = response;
		this.messages = [];
	}

	flush() {
		this.endMessage();

		// Hubot's send and reply functions are asychronous, which
		//   means if I call them multiple times, my messages aren't
		//   guaranteed to be in order, so I need to send them as
		//   arrays to assure correct order.
		var sends = [];
		var replies = [];

		for (let message of this.messages) {
			if (message.type === MESSAGE_SEND)
				sends.push(message.content);
			else
				replies.push(message.content);
		}
		sends.reverse();
		// console.log(sends);
		// console.log(this.messages);
		if (sends.length)
			this.response.send(...sends);

		if (replies.length)
			this.response.reply(...replies);

		this.messages = [];
	}

	send(output) {
		if (this.runningMessage)
			this.endMessage();

		this.messages.push({
			type: MESSAGE_SEND,
			content: output,
		});
	}

	reply(output) {
		if (this.runningMessage)
			this.endMessage();

		this.messages.push({
			type: MESSAGE_REPLY,
			content: output,
		});
	}

	startMessage(type) {
		this.runningMessage = {
			type: type,
			content: '',
		};
	}

	endMessage() {
		if (this.runningMessage) {
			if (this.runningMessage.content)
				this.messages.push(this.runningMessage);
			this.runningMessage = null;
		}
	}

	/**
	 * Append output to the currently running message
	 */
	append(output) {
		if (!this.runningMessage)
			this.startMessage(MESSAGE_SEND);

		this.runningMessage.content += output;
	}

	startSend() { this.startMessage(MESSAGE_SEND); }
	endSend()   { this.endMessage(); }

	startReply() { this.startMessage(MESSAGE_REPLY); }
	endReply()   { this.endMessage(); }

}

OutputBuffer.MESSAGE_SEND  = MESSAGE_SEND;
OutputBuffer.MESSAGE_REPLY = MESSAGE_REPLY;

export default OutputBuffer;
