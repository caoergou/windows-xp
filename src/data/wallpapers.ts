import Bliss from '../assets/images/wallpapers/Bliss.jpg';
import Ascent from '../assets/images/wallpapers/Ascent.jpg';
import Autumn from '../assets/images/wallpapers/Autumn.jpg';
import Azul from '../assets/images/wallpapers/Azul.jpg';
import Crystal from '../assets/images/wallpapers/Crystal.jpg';
import Follow from '../assets/images/wallpapers/Follow.jpg';
import Friend from '../assets/images/wallpapers/Friend.jpg';
import Home from '../assets/images/wallpapers/Home.jpg';
import MoonFlower from '../assets/images/wallpapers/Moon_flower.jpg';
import Peace from '../assets/images/wallpapers/Peace.jpg';
import Power from '../assets/images/wallpapers/Power.jpg';
import PurpleFlower from '../assets/images/wallpapers/Purple_flower.jpg';
import Radiance from '../assets/images/wallpapers/Radiance.jpg';
import RedMoonDesert from '../assets/images/wallpapers/Red_moon_desert.jpg';
import Ripple from '../assets/images/wallpapers/Ripple.jpg';
import Stonehenge from '../assets/images/wallpapers/Stonehenge.jpg';
import Tulips from '../assets/images/wallpapers/Tulips.jpg';
import VortecSpace from '../assets/images/wallpapers/Vortec_space.jpg';
import Wind from '../assets/images/wallpapers/Wind.jpg';
import WindowsXP from '../assets/images/wallpapers/Windows_XP.jpg';

export interface WallpaperItem {
  id: string;
  name: string;
  src: string;
}

export const WALLPAPERS: WallpaperItem[] = [
  { id: 'Bliss', name: 'Bliss (Windows XP)', src: Bliss },
  { id: 'Ascent', name: 'Ascent', src: Ascent },
  { id: 'Autumn', name: 'Autumn', src: Autumn },
  { id: 'Azul', name: 'Azul', src: Azul },
  { id: 'Crystal', name: 'Crystal', src: Crystal },
  { id: 'Follow', name: 'Follow', src: Follow },
  { id: 'Friend', name: 'Friend', src: Friend },
  { id: 'Home', name: 'Home', src: Home },
  { id: 'Moon_flower', name: 'Moon flower', src: MoonFlower },
  { id: 'Peace', name: 'Peace', src: Peace },
  { id: 'Power', name: 'Power', src: Power },
  { id: 'Purple_flower', name: 'Purple flower', src: PurpleFlower },
  { id: 'Radiance', name: 'Radiance', src: Radiance },
  { id: 'Red_moon_desert', name: 'Red moon desert', src: RedMoonDesert },
  { id: 'Ripple', name: 'Ripple', src: Ripple },
  { id: 'Stonehenge', name: 'Stonehenge', src: Stonehenge },
  { id: 'Tulips', name: 'Tulips', src: Tulips },
  { id: 'Vortec_space', name: 'Vortec space', src: VortecSpace },
  { id: 'Wind', name: 'Wind', src: Wind },
  { id: 'Windows_XP', name: 'Windows XP', src: WindowsXP },
];

export const DEFAULT_WALLPAPER_ID = 'Bliss';

export const getWallpaperById = (id: string): WallpaperItem =>
  WALLPAPERS.find(w => w.id === id) ?? WALLPAPERS[0];
