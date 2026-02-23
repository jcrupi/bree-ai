import React from 'react';
export const Dialog = ({ children }: any) => <div>{children}</div>;
export const DialogContent = ({ children }: any) => <div className="dialog-content">{children}</div>;
export const DialogHeader = ({ children }: any) => <div className="dialog-header">{children}</div>;
export const DialogFooter = ({ children }: any) => <div className="dialog-footer">{children}</div>;
export const DialogTitle = ({ children }: any) => <h2>{children}</h2>;
export const DialogDescription = ({ children }: any) => <p>{children}</p>;
