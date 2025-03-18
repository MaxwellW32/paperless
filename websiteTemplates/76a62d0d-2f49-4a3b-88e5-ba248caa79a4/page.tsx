import { navBarsType } from '@/types';
import Link from 'next/link';
import React from 'react';
import "@/app/globals.css";

export default function Nav({ data }: { data: navBarsType }) {
    return (
        <nav {...data.mainElProps} className={`nav${data.styleId} ${data.mainElProps?.className}`}>
            <ul className={`navMenu${data.styleId}`}>
                {data.menu.map((menuItem, menuItemIndex) => (
                    <li key={menuItemIndex} className={`navItem${data.styleId}`}>
                        <Link href={menuItem.link} className={`navLink${data.styleId}`}>
                            {menuItem.label}
                        </Link>

                        {menuItem.subMenu && menuItem.subMenu.length > 0 && (
                            <ul className={`navSubmenu${data.styleId}`}>
                                {menuItem.subMenu.map((subMenuItem, subMenuItemIndex) => (
                                    <li key={subMenuItemIndex} className={`submenuItem${data.styleId}`}>
                                        <Link href={subMenuItem.link} className={`submenuLink${data.styleId}`}>
                                            {subMenuItem.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
}
