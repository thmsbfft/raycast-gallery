import {
  environment
} from "@raycast/api";

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// ⚠️⚠️⚠️
// This won't work everywhere :~)
ffmpeg.setFfmpegPath("/opt/homebrew/bin/ffmpeg");

class Indexer {
	thumbnails_path: string

	constructor() {
		this.thumbnails_path = environment.supportPath + "/thumbnails";
		console.log("Indexer support path:", this.thumbnails_path);
		
		// Check if the thumbnail folder exists
		// and create it otherwise
		if (!fs.existsSync(this.thumbnails_path)) {
			fs.mkdirSync(this.thumbnails_path);
		}
	}

	get_thumbnail(file_path: string) {
		console.log("Getting thumbnail for:", file_path);
		
		const parsed = path.parse(file_path);
		const thumb_path = this.thumbnails_path + "/" + parsed.name + ".jpg";
		const thumb_name = parsed.name + ".jpg";

		console.log(thumb_path);

		if (fs.existsSync(thumb_path)) {
			console.log('Thumbnail found.');
			return thumb_path;
		}
		else {
			this.generate_thumbnail(file_path, thumb_name);
			return thumb_path;
		}
	}

	generate_thumbnail(file_path: string, thumb_name: string) {
		console.log("Creating thumbnail for:", file_path);

		ffmpeg(file_path)
			.on('end', () => {
				console.log('Screenshot taken.');
			})
			.screenshots({
				count: 1,
				timestamps: ["33%"],
				size: "800x?",
				folder: this.thumbnails_path,
				filename: thumb_name
			});
	}

}

export { Indexer }