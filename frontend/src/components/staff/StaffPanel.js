import React from 'react';
import AdminPanel from '../../pages/AdminPanel';

/**
 * StaffPanel
 *
 * Thin wrapper around the existing AdminPanel page so staff can
 * review, approve, calculate, and send user predictions from the
 * staff dashboard without duplicating logic.
 */
export default function StaffPanel() {
  return <AdminPanel />;
}
