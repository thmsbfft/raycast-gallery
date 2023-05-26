import { useState, useMemo } from "react";
import {
  ActionPanel,
  Action,
  Grid,
  Image,
  Icon,
  Application,
  getPreferenceValues,
  clearSearchBar,
  openCommandPreferences
} from "@raycast/api";

import open = require("open");
import { homedir } from "os";
import { statSync } from "fs";
import { sync } from "glob";
import { extname } from "path";
import { randomUUID } from "crypto";

import { Indexer } from "./indexer"

interface Preferences {
  paths: string;
  videos: boolean;
  titles: boolean;
  itemSize: string;
}

const indexer = new Indexer();

type MediaList = MediaFile[];

class MediaFile {
  id: string;
  name: string;
  displayPath: string;
  fullPath: string;
  fileKind: string;
  keywords: string[];

  constructor(path: string) {
    this.id = randomUUID();
    this.fullPath = path;
    this.displayPath = path;

    if (path.startsWith(homedir())) {
      this.displayPath = path.replace(homedir(), "~");
    }
    const parts = path.split("/");
    this.name = parts[parts.length - 1];

    const ext = extname(this.fullPath);
    if ([".mp4", ".mov", ".mkv", ".webm"].includes(ext)) {
      this.fileKind = "VIDEO";
      this.thumbnail = indexer.get_thumbnail(this.fullPath);
    }
    else {
      this.fileKind = "IMAGE";
    }

    // To create a list of keywords,
    // break down filename and trim
    // empty strings
    this.keywords = this.name.split(/[ _.—-]/i).filter((w) => w.length > 0);
  }
}

function getMediaFolder(folder: string): {
  images: MediaList;
} {
  let scope: string[];

  // The scope of search can be either everything,
  // or a single folder path
  if (folder == "Everything") {
    scope = getPreferenceValues<Preferences>()
      .paths.split(",")
      .map((p) => p.trim());
  } else {
    scope = new Array(folder.trim());
  }

  // Walk the scope and create Images
  let images = scope
    .flatMap((base) => {
      if (base.startsWith("~")) {
        base = homedir() + base.slice(1);
      }
      return sync(base + "/*");
    })
    .filter((path) => statSync(path)?.isFile())
    .sort((a, b) => {
      // Sort by most recently created first

      const aBirth = new Date(statSync(a)?.birthtime);
      const bBirth = new Date(statSync(b)?.birthtime);

      if (aBirth > bBirth) {
        return -1;
      } else {
        return 1;
      }
    })
    .map((path) => new MediaFile(path));

  if (!getPreferenceValues<Preferences>().videos) {
    // If the preference (checkbox) is false,
    // filter images to skip videos fileKind
    images = images.filter((image) => image.fileKind != "VIDEO");
  }

  return { images };
}

function getGridItemContent(image: MediaFile) {
  console.log(image);

  if (image.fileKind === "VIDEO") {
    // Videos
    if(image.thumbnail) {
      return { 
        source: image.thumbnail
      }
    } 
    else {
      return {
        fileIcon: image.fullPath
      }
    }
  }
  else {
    // Images
    return {
      source: image.fullPath,
      fallback: Icon.Dot,
    }
  }            
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [isLoading, setIsLoading] = useState(false);

  // Get folders listed in preferences
  const folderPaths = preferences.paths.split(",").map((s) => s.trim());
  folderPaths.unshift("Everything");

  const [{ images }, setImages] = useState(getMediaFolder(folderPaths[0]));

  return (
    <Grid
      navigationTitle="Gallery"
      searchBarPlaceholder="Search..."
      isLoading={isLoading}
      itemSize={preferences.itemSize as Grid.ItemSize}
      searchBarAccessory={
        <Grid.Dropdown
          tooltip="View collection"
          storeValue={false}
          onChange={(newValue) => {
            setIsLoading(true);
            // Reload images with correct filtering...
            setImages(getMediaFolder(newValue));
            // This ↓ somehow doesn't seem to do anything?
            clearSearchBar({ forceScrollToTop: true });
            setIsLoading(false);
          }}
        >
          {folderPaths.flatMap((folder, index) => {
            return <Grid.Dropdown.Item key={index} title={folder} value={folder} />;
          })}
        </Grid.Dropdown>
      }
    >
      {!isLoading &&
        images.map((image) => (
          <Grid.Item
            key={image.id}
            keywords={image.keywords}
            title={preferences.titles ? image.name : ""}
            content={getGridItemContent(image)}
            quickLook={{ path: image.fullPath, name: image.name }}
            actions={
              <ActionPanel title={image.name}>
                <Action.Open 
                  title="Open"
                  icon={Icon.Upload}
                  target={image.fullPath}
                />
                <Action.ShowInFinder
                  title={"Reveal in Finder"}
                  path={image.fullPath}
                  shortcut={{ modifiers: ["cmd"], key: "f" }}
                />
                <Action.ToggleQuickLook shortcut={{ modifiers: ["cmd"], key: "y" }} />
                <Action
                  title="Configure Command"
                  icon={Icon.Gear}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "," }}
                  onAction={openCommandPreferences}
                />
              </ActionPanel>
            }
          />
        ))}
    </Grid>
  );
}
