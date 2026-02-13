import React from 'react';

// Windows XP authentic icons from react-old-icons (downloaded as local .webp)
import computerIcon from '../assets/icons/xp/computer.webp';
import documentsIcon from '../assets/icons/xp/documents.webp';
import recycleBinIcon from '../assets/icons/xp/recycle_bin.webp';
import ieIcon from '../assets/icons/xp/ie.webp';
import folderIcon from '../assets/icons/xp/folder.webp';
import folderOpenIcon from '../assets/icons/xp/folder_open.webp';
import fileIcon from '../assets/icons/xp/file.webp';
import driveIcon from '../assets/icons/xp/drive.webp';
import userIcon from '../assets/icons/xp/user.webp';
import shutdownIcon from '../assets/icons/xp/shutdown.webp';
import networkIcon from '../assets/icons/xp/network.webp';
import emailIcon from '../assets/icons/xp/email.webp';
import searchIcon from '../assets/icons/xp/search.webp';
import homeIcon from '../assets/icons/xp/home.webp';
import favoritesIcon from '../assets/icons/xp/favorites.webp';
import historyIcon from '../assets/icons/xp/history.webp';
import printIcon from '../assets/icons/xp/print.webp';
import clockIcon from '../assets/icons/xp/clock.webp';
import imageIcon from '../assets/icons/xp/image.webp';
import htmlIcon from '../assets/icons/xp/html.webp';
import propertiesIcon from '../assets/icons/xp/properties.webp';
import appWindowIcon from '../assets/icons/xp/app_window.webp';
import journalIcon from '../assets/icons/xp/journal.webp';
import recycleBinFullIcon from '../assets/icons/xp/recycle_bin_full.webp';
import calculatorIcon from '../assets/icons/xp/WindowsXPCalculator.webp';
import paintIcon from '../assets/icons/xp/WindowsXPPaint.webp';
import soundIcon from '../assets/icons/xp/WindowsXPSound.webp';
import controlPanelIcon from '../assets/icons/xp/WindowsXPControlPanel.webp';
import printerIcon from '../assets/icons/xp/WindowsXPPrinter.webp';
import mediaPlayerIcon from '../assets/icons/xp/WindowsMediaPlayer.webp';
import musicLibraryIcon from '../assets/icons/xp/WindowsMusicLibrary.webp';

// Icons without react-old-icons equivalents (keep original)
import qqIcon from '../assets/icons/qq.png';
import alertErrorIcon from '../assets/icons/alert_error.png';
import alertInfoIcon from '../assets/icons/alert_info.png';
import alertWarningIcon from '../assets/icons/alert_warning.png';
import qzoneIcon from '../assets/icons/qzone.png';
import tiebaIcon from '../assets/icons/tieba.svg';
import thunderIcon from '../assets/icons/thunder.svg';
import kugouIcon from '../assets/icons/kugou.svg';
import baofengIcon from '../assets/icons/baofeng.svg';
import safe360Icon from '../assets/icons/360safe.svg';
import wpsIcon from '../assets/icons/wps.svg';

// SVG toolbar/UI icons (small UI elements, no XP equivalents)
import refreshIcon from '../assets/icons/refresh.svg';
import pasteIcon from '../assets/icons/paste.svg';
import newFolderIcon from '../assets/icons/new_folder.svg';
import newShortcutIcon from '../assets/icons/new_shortcut.svg';
import windowsIcon from '../assets/icons/windows.svg';
import logoutIcon from '../assets/icons/logout.svg';
import backIcon from '../assets/icons/back.svg';
import forwardIcon from '../assets/icons/forward.svg';
import upIcon from '../assets/icons/up.svg';
import chevronDownIcon from '../assets/icons/chevron_down.svg';
import viewsIcon from '../assets/icons/views.svg';
import stopIcon from '../assets/icons/stop.svg';

const IconMap = {
    "computer": computerIcon,
    "documents": documentsIcon,
    "recycle_bin": recycleBinIcon,
    "ie": ieIcon,
    "html": htmlIcon,
    "folder": folderIcon,
    "folder_open": folderOpenIcon,
    "file": fileIcon,
    "drive": driveIcon,
    "qq": qqIcon,
    "refresh": refreshIcon,
    "paste": pasteIcon,
    "new_folder": newFolderIcon,
    "new_shortcut": newShortcutIcon,
    "properties": propertiesIcon,
    "user": userIcon,
    "windows": windowsIcon,
    "logout": logoutIcon,
    "shutdown": shutdownIcon,
    "app_window": appWindowIcon,
    "network": networkIcon,
    "alert_error": alertErrorIcon,
    "alert_info": alertInfoIcon,
    "alert_warning": alertWarningIcon,
    "qzone": qzoneIcon,
    "journal": journalIcon,
    "recycle_bin_full": recycleBinFullIcon,
    "tieba": tiebaIcon,
    "email": emailIcon,
    "back": backIcon,
    "forward": forwardIcon,
    "up": upIcon,
    "search": searchIcon,
    "chevron_down": chevronDownIcon,
    "home": homeIcon,
    "views": viewsIcon,
    "favorites": favoritesIcon,
    "history": historyIcon,
    "print": printIcon,
    "stop": stopIcon,
    "image": imageIcon,
    "clock": clockIcon,
    "calculator": calculatorIcon,
    "paint": paintIcon,
    "sound": soundIcon,
    "control_panel": controlPanelIcon,
    "printer": printerIcon,
    "media_player": mediaPlayerIcon,
    "music_library": musicLibraryIcon,
    "thunder": thunderIcon,
    "kugou": kugouIcon,
    "baofeng": baofengIcon,
    "360safe": safe360Icon,
    "wps": wpsIcon,
};

const XPIcon = ({ name, size = 32, className, color, style, ...rest }) => {
    const iconSrc = IconMap[name] || fileIcon;

    return (
        <img
            src={iconSrc}
            alt={name}
            width={size}
            height={size}
            className={className}
            draggable={false}
            style={{
                imageRendering: size <= 16 ? 'auto' : undefined,
                ...style,
            }}
            {...rest}
        />
    );
};

export default XPIcon;
