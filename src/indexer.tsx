import { environment } from "@raycast/api";

import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

// ⚠️⚠️⚠️
// This won't work everywhere :~)
ffmpeg.setFfmpegPath("/opt/homebrew/bin/ffmpeg");

class Indexer {
  thumbnails_path: string;

  constructor() {
    this.thumbnails_path = environment.supportPath + "/thumbnails";

    // Check if the thumbnail folder exists
    // and create it otherwise
    if (!fs.existsSync(this.thumbnails_path)) {
      fs.mkdirSync(this.thumbnails_path);
    }
  }

  get_thumbnail(file_path: string) {
    // console.log("Getting thumbnail for:", file_path);

    const parsed = path.parse(file_path);
    const thumb_ext = parsed.ext.substring(1);
    const thumb_filename = parsed.name + "-" + thumb_ext + ".jpg";
    const thumb_path = this.thumbnails_path + "/" + thumb_filename;

    // console.log(thumb_path);

    if (fs.existsSync(thumb_path)) {
      // console.log('Thumbnail found.');
      return thumb_path;
    } else {
      this.generate_thumbnail(file_path, thumb_filename);
      return thumb_path;
    }
  }

  generate_thumbnail(file_path: string, thumb_filename: string) {
    console.log("Creating thumbnail for:", file_path);

    ffmpeg(file_path)
      .on("end", () => {
        console.log("Screenshot taken.");
      })
      .on("error", (err) => {
      	console.error("Failed to create thumbnail for:", file_path);
      })
      .screenshots({
        count: 1,
        timestamps: ["33%"],
        size: "800x?",
        folder: this.thumbnails_path,
        filename: thumb_filename,
      });
  }
}

export { Indexer };
