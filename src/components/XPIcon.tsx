import React from 'react';

// Authentic Windows XP system/app icons from xp-research/organized/icons/XPIcons/XP/
// and react-xp/frontend/public/, resized to a consistent 48×48.
// Imported as modules so Vite handles the base URL and hashing.
import computerIcon from '../assets/icons/xp-system-large/computer.png';
import documentsIcon from '../assets/icons/xp-system-large/documents.png';
import recycleBinIcon from '../assets/icons/xp-system-large/recycle_bin.png';
import recycleBinFullIcon from '../assets/icons/xp-system-large/recycle_bin_full.png';
import ieIcon from '../assets/icons/xp-system-large/ie.png';
import folderIcon from '../assets/icons/xp-system-large/folder.png';
import folderOpenIcon from '../assets/icons/xp-system-large/folder_open.png';
import fileIcon from '../assets/icons/xp-system-large/file.png';
import driveIcon from '../assets/icons/xp-system-large/drive.png';
import userIcon from '../assets/icons/xp-system-large/user.png';
import networkIcon from '../assets/icons/xp-system-large/network.png';
import controlPanelIcon from '../assets/icons/xp-system-large/control_panel.png';
import printerIcon from '../assets/icons/xp-system-large/printer.png';
import helpIcon from '../assets/icons/xp-system-large/help.png';
import searchIcon from '../assets/icons/xp-system-large/search.png';
import runIcon from '../assets/icons/xp-system-large/run.png';
import appWindowIcon from '../assets/icons/xp-system-large/app_window.png';
import journalIcon from '../assets/icons/xp-system-large/journal.png';
import txtIcon from '../assets/icons/xp-system-large/txt.png';
import docIcon from '../assets/icons/xp-system-large/doc.png';
import xlsIcon from '../assets/icons/xp-system-large/xls.png';
import pdfIcon from '../assets/icons/xp-system-large/pdf.png';
import paintIcon from '../assets/icons/xp-system-large/paint.png';
import mediaPlayerIcon from '../assets/icons/xp-system-large/media_player.png';
import musicLibraryIcon from '../assets/icons/xp-system-large/music_library.png';
import solitaireIcon from '../assets/icons/xp-system-large/solitaire.png';

// Additional authentic Windows XP icons from xp-research (XPIcons/XP, winxpsite, etc.)
import alertIcon from '../assets/icons/xp/alert.png';
import securityCenterIcon from '../assets/icons/xp/security_center.png';
import networkConnectionsIcon from '../assets/icons/xp/network_connections.png';
import wirelessNetworkIcon from '../assets/icons/xp/wireless_network.png';
import volumeIcon from '../assets/icons/xp/volume.png';
import muteIcon from '../assets/icons/xp/mute.png';
import cdRomIcon from '../assets/icons/xp/cd_rom.png';
import deleteXPIcon from '../assets/icons/xp/delete.png';
import addIcon from '../assets/icons/xp/add.png';
import stopXPIcon from '../assets/icons/xp/stop.png';
import checklistIcon from '../assets/icons/xp/checklist.png';
import dialogWarningIcon from '../assets/icons/xp/dialog_warning.png';
import dialogErrorIcon from '../assets/icons/xp/dialog_error.png';
import dialogInfoIcon from '../assets/icons/xp/dialog_info.png';
import mediaPlayIcon from '../assets/icons/xp/media/play.png';
import mediaPauseIcon from '../assets/icons/xp/media/pause.png';
import mediaStopIcon from '../assets/icons/xp/media/stop.png';
import mediaPreviousIcon from '../assets/icons/xp/media/previous.png';
import mediaNextIcon from '../assets/icons/xp/media/next.png';

// Icons without large XP equivalents (keep original assets)
import shutdownIcon from '../assets/icons/xp/shutdown.webp';
import emailIcon from '../assets/icons/xp/email.webp';
import clockIcon from '../assets/icons/xp/clock.webp';
import imageIcon from '../assets/icons/xp/image.webp';
import htmlIcon from '../assets/icons/xp/html.webp';
import propertiesIcon from '../assets/icons/xp/properties.webp';
import calculatorIcon from '../assets/icons/xp/WindowsXPCalculator.webp';
import minesweeperIcon from '../assets/icons/xp/minesweeper.webp';
import soundIcon from '../assets/icons/xp/WindowsXPSound.webp';

// Icons without react-old-icons equivalents (keep original)
import qqIcon from '../assets/icons/xp/qq.png';
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
import copyIcon from '../assets/icons/copy.svg';
import cutIcon from '../assets/icons/cut.svg';
import deleteIcon from '../assets/icons/delete.svg';
import newFolderIcon from '../assets/icons/new_folder.svg';
import newShortcutIcon from '../assets/icons/new_shortcut.svg';
import windowsIcon from '../assets/icons/windows.svg';
import logoutIcon from '../assets/icons/logout.svg';
import chevronDownIcon from '../assets/icons/chevron_down.svg';

// Windows XP authentic toolbar icons from winXP reference project
import backIconXP from '../assets/windowsIcons/back.png';
import forwardIconXP from '../assets/windowsIcons/forward.png';
import upIconXP from '../assets/windowsIcons/up.png';
import homeIconXP from '../assets/windowsIcons/home.png';
import refreshIconXP from '../assets/windowsIcons/refresh.png';
import stopIconXP from '../assets/windowsIcons/stop.png';
import folderOpenIconXP from '../assets/windowsIcons/337(32x32).png';
import viewsIconXP from '../assets/windowsIcons/358(32x32).png';
import historyIconXP from '../assets/windowsIcons/history.png';
import favoritesIconXP from '../assets/windowsIcons/744(32x32).png';
import mailIconXP from '../assets/windowsIcons/mail.png';
import editIconXP from '../assets/windowsIcons/edit.png';
import windowsLogoXP from '../assets/windowsIcons/windows.png';
import dropdownIconXP from '../assets/windowsIcons/dropdown.png';
import goIconXP from '../assets/windowsIcons/290.png';
import earthIconXP from '../assets/windowsIcons/earth.png';
import viewInfoIconXP from '../assets/windowsIcons/view-info.ico';
import removeIconXP from '../assets/windowsIcons/302(16x16).png';
import controlIconXP from '../assets/windowsIcons/300(16x16).png';

const IconMap: Record<string, string> = {
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
    "refresh_svg": refreshIcon,
    "paste": pasteIcon,
    "copy": copyIcon,
    "cut": cutIcon,
    "delete": deleteIcon,
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
    "txt": txtIcon,
    "doc": docIcon,
    "xls": xlsIcon,
    "pdf": pdfIcon,
    "recycle_bin_full": recycleBinFullIcon,
    "tieba": tiebaIcon,
    "email": emailIcon,
    "back": backIconXP,
    "forward": forwardIconXP,
    "up": upIconXP,
    "search": searchIcon,
    "chevron_down": chevronDownIcon,
    "home": homeIconXP,
    "views": viewsIconXP,
    "favorites": favoritesIconXP,
    "history": historyIconXP,
    "print": printerIcon,
    "stop": stopIconXP,
    "refresh": refreshIconXP,
    "folder_open_toolbar": folderOpenIconXP,
    "mail": mailIconXP,
    "edit": editIconXP,
    "windows_logo": windowsLogoXP,
    "dropdown": dropdownIconXP,
    "go": goIconXP,
    "earth": earthIconXP,
    "view_info": viewInfoIconXP,
    "remove": removeIconXP,
    "control": controlIconXP,
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
    "minesweeper": minesweeperIcon,
    "solitaire": solitaireIcon,
    "media": mediaPlayerIcon,
    "controlpanel": controlPanelIcon,
    "cmd": appWindowIcon,
    "volume": soundIcon,
    "help": helpIcon,
    "run": runIcon,
    "alert": alertIcon,
    "security_center": securityCenterIcon,
    "network_connections": networkConnectionsIcon,
    "wireless_network": wirelessNetworkIcon,
    "volume_status": volumeIcon,
    "mute": muteIcon,
    "cd_rom": cdRomIcon,
    "delete_xp": deleteXPIcon,
    "add": addIcon,
    "stop_xp": stopXPIcon,
    "checklist": checklistIcon,
    "dialog_warning": dialogWarningIcon,
    "dialog_error": dialogErrorIcon,
    "dialog_info": dialogInfoIcon,
    "media_play": mediaPlayIcon,
    "media_pause": mediaPauseIcon,
    "media_stop": mediaStopIcon,
    "media_previous": mediaPreviousIcon,
    "media_next": mediaNextIcon
};

interface XPIconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

const XPIcon = ({ name, size = 32, className, _color, style, ...rest }: XPIconProps) => {
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
