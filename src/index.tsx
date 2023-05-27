import { useState } from "react";
import {
  ActionPanel,
  Action,
  Grid,
  Icon,
  getPreferenceValues,
  clearSearchBar,
  openCommandPreferences,
} from "@raycast/api";

import { homedir } from "os";
import { statSync } from "fs";
import { sync } from "glob";
import { extname } from "path";
import { randomUUID } from "crypto";

import { Indexer } from "./indexer";

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
    if ([".mp4", ".mov", ".mkv", ".webm", ".m4v"].includes(ext)) {
      this.fileKind = "VIDEO";
      this.thumbnail = indexer.get_thumbnail(this.fullPath);
    } else if ([".gif"].includes(ext)) {
      this.fileKind = "GIF";
    } else {
      this.fileKind = "IMAGE";
    }

    // To create a list of keywords,
    // break down filename and trim
    // empty strings
    this.keywords = this.name.split(/[ _.—-]/i).filter((w) => w.length > 0);
  }
}

function getList(folder: string): {
  mediaList: MediaList;
} {
  let scope: string[];

  // The scope of search is either literally
  // "Everything", or a single folder path
  if (folder == "Everything") {
    scope = getPreferenceValues<Preferences>()
      .paths.split(",")
      .map((p) => p.trim());
  } else {
    scope = new Array(folder.trim());
  }

  // Walk the scope and create
  // the list of MediaFiles
  let mediaList = scope
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
    // filter the list to skip videos
    mediaList = mediaList.filter((image) => image.fileKind != "VIDEO");
  }

  return { mediaList };
}

function getGridItemContent(media: MediaFile) {
  // console.log(media);

  if (media.fileKind === "VIDEO") {
    // Videos
    if (media.thumbnail) {
      return {
        source: media.thumbnail,
        fallback: Icon.Dot,
      };
    } else {
      return {
        fileIcon: media.fullPath,
      };
    }
  } else {
    // Images
    return {
      source: media.fullPath,
      fallback: Icon.Dot,
    };
  }
}

function getGridItemTitle(media: MediaFile) {
  const preferences = getPreferenceValues<Preferences>();

  if (preferences.titles) {
    if (media.fileKind === "VIDEO" || media.fileKind === "GIF") {
      // Video and GIF filenames are decorated
      // with a "play" indicator
      return "▸ " + media.name;
    }
    return media.name;
  }

  return "";
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [isLoading, setIsLoading] = useState(false);

  // Get folders listed in preferences
  const folderPaths = preferences.paths.split(",").map((s) => s.trim());
  folderPaths.unshift("Everything");

  const [{ mediaList }, setMediaList] = useState(getList(folderPaths[0]));

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
            // Reload media list with the new scope...
            setMediaList(getList(newValue));
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
        mediaList.map((media) => (
          <Grid.Item
            key={media.id}
            keywords={media.keywords}
            title={getGridItemTitle(media)}
            content={getGridItemContent(media)}
            quickLook={{ path: media.fullPath, name: media.name }}
            actions={
              <ActionPanel title={media.name}>
                <Action.Open title="Open" icon={Icon.Upload} target={media.fullPath} />
                <Action.ShowInFinder
                  title={"Reveal in Finder"}
                  path={media.fullPath}
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
