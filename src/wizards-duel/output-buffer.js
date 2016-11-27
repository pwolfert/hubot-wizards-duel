const MESSAGE_SEND = 0;
const MESSAGE_REPLY = 1;

class OutputBuffer {

	constructor(response) {
		this.response = response;
		this.messages = [];
	}

	flush() {
		this.endMessage();
		
		for (let message of this.messages) {
			if (message.type === MESSAGE_SEND)
				this.response.send(message.content);
			else
				this.response.reply(message.content);
		}

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
