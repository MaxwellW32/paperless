import { containersType } from '@/types';
import React from 'react';
import "@/app/globals.css";

export default function ContainTwo({ data }: { data: containersType }) {
  return (
    <div {...data.mainElProps} className={`container${data.styleId} ${data.mainElProps.className ?? ""}`}
    >
      <h1 className={`container-header${data.styleId}`}>This is my second element with children</h1>

      <p className={`container-grid-item${data.styleId}`}>Wooo Container 2</p>

      <div className={`container-children${data.styleId}`}>
        {data.children}
      </div>

      <p className={`container-footer${data.styleId}`}>This is text below container 2</p>
    </div>

  );
}