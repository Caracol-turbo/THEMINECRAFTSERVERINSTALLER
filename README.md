# Minecraft Server Installer

A simple desktop application for creating Minecraft servers without having to manually download files, accept the EULA or write startup scripts.

It supports several popular server software options and takes care of most of the setup automatically.

## Features

- Supports Vanilla, Paper, Purpur, Fabric, Forge and NeoForge
- Downloads the selected server version automatically
- Accepts the EULA for you
- Generates the startup script
- Lets you choose the amount of RAM
- Creates a clean server folder ready to use

---

## Requirements

Before running the application, make sure you have:

- **Python 3**
- **Java 21**

You can check both with:

```bash
python --version
java -version
```

---

## Installation

The recommended way to use the application is through the releases.

1. Open the **Releases** page of this repository.
2. Download the latest release.
3. Extract the downloaded archive.
4. Run **`Ejecutar.py`**.

That's it.

---

## Playit.gg

> **Current status:** Playit integration is still a work in progress.

At the moment, the built-in Playit setup is **not fully functional**.

If you want remote access to your server, you'll need to:

1. Install the official Playit client on your computer.
2. Create and link an agent manually.
3. Create the required tunnel from the Playit dashboard.

A future update will automate this process from within the application.

---

## Supported Server Software

- Vanilla
- Paper
- Purpur
- Fabric
- Forge
- NeoForge

---

## Notes

- The application is available in **English**.
- An internet connection is required to download server files.
- Forge and NeoForge installations may take a little longer since they need to run their own installer.

---

## Contributing

Bug reports, feature requests and pull requests are always welcome.

If you find an issue, feel free to open one.

---

## License

This project is licensed under the MIT License.
