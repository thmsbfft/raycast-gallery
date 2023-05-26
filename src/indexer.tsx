import {
  environment
} from "@raycast/api";

const fs = require('fs');
const path = require('path');

class Indexer {
	path: string

	constructor() {
		this.path = environment.supportPath + "/thumbnails";
		console.log("Indexer support path:", this.path);
		
		// Check if the thumbnail folder exists
		// and create it otherwise.
		if (!fs.existsSync(this.path)) {
			fs.mkdirSync(this.path);
		}
	}

	get_thumbnail(file_path: string) {
		console.log("Getting thumbnail for:", file_path);
		
		const parsed = path.parse(file_path);
		const thumb_path = this.path + "/" + parsed.name + ".jpg";

		console.log(thumb_path);
	}

}

export { Indexer }