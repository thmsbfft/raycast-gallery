import { useState, useMemo } from "react";
import { 
  ActionPanel,
  Action,
  Grid,
  Image,
  Icon,
  Application,
  getPreferenceValues 
} from "@raycast/api";

import open = require("open");
import { homedir } from "os";
import { statSync } from "fs";
import { sync } from "glob";
import { extname } from 'path';
import { randomUUID } from 'crypto';

interface Preferences {
  paths: string
}

type ImageList = Image[];

class Image {
  id: string;
  name: string;
  displayPath: string;
  fullPath: string;
  fileKind: string;

  constructor(path: string) {
    this.id = randomUUID();
    this.fullPath = path;
    this.displayPath = path;

    if (path.startsWith(homedir())) {
      this.displayPath = path.replace(homedir(), "~");
    }
    const parts = path.split("/");
    this.name = parts[parts.length - 1];

    const ext = extname(this.fullPath)
    if ([".mp4", ".mov", ".mkv", ".webm"].includes(ext)) {
      this.fileKind = "VIDEO"
    }
  }
}

function getImages(): {
  images: ImageList;
} {

  const folderPaths = getPreferenceValues<Preferences>()
    .paths.split(",")
    .map((s) => s.trim());

  console.log(folderPaths);

  const images = folderPaths
    .flatMap((base) => {
      if (base.startsWith("~")) {
        base = homedir() + base.slice(1);
      }
      return sync(base + "/*");
    })
    .filter((path) => statSync(path)?.isFile())
    .sort((a, b) => {
      // Sort by most recently created first

      const aBirth = Date.parse(statSync(a)?.birthtime);
      const bBirth = Date.parse(statSync(b)?.birthtime);

      if (aBirth > bBirth) {
        return -1;
      }
      else {
        return 1;
      }
    })
    .map((path) => new Image(path));

  return { images };
}

export default function Command() {
  const [itemSize, setItemSize] = useState<Grid.ItemSize>(Grid.ItemSize.Medium);
  const [isLoading, setIsLoading] = useState(true);

  const { images } = getImages();

  return (
    <Grid
      navigationTitle="Gallery"
      itemSize={itemSize}
      isLoading={isLoading}
      searchBarPlaceholder="Search..."
      searchBarAccessory={
        <Grid.Dropdown
          tooltip="Size"
          storeValue
          onChange={(newValue) => {
            setItemSize(newValue as Grid.ItemSize);
            setIsLoading(false);
          }}
        >
          <Grid.Dropdown.Item title="Large" value={Grid.ItemSize.Large} />
          <Grid.Dropdown.Item title="Medium" value={Grid.ItemSize.Medium} />
          <Grid.Dropdown.Item title="Small" value={Grid.ItemSize.Small} />
        </Grid.Dropdown>
      }
    >
      {!isLoading &&
        images.map((image) => (
          <Grid.Item
            key={image.id}
            title={image.name}
            content={ image.fileKind === "VIDEO" ? Icon.Dot : {
              source: image.fullPath,
              fallback: Icon.Dot
            }}
            quickLook={{ path: image.fullPath, name: image.name }}
            actions={
              <ActionPanel>
                <Action.Open title="Open" target={image.fullPath} />
                <Action.ShowInFinder
                  title={"Open in Finder"}
                  path={image.fullPath}
                  shortcut={{ modifiers: ["cmd"], key: "f" }}
                />
                <Action.ToggleQuickLook shortcut={{ modifiers: ["cmd"], key: "y" }} />
              </ActionPanel>
            }
          />
        ))
      }
    </Grid>
  );
}
