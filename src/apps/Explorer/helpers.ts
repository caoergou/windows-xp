// Explorer pure helpers (#163/A+E).

/** Whether a My-Computer drive key names an optical (CD/DVD) drive. */
export const isOpticalDrive = (key: string): boolean => /DVD|CD-RW|CD-ROM/i.test(key);
