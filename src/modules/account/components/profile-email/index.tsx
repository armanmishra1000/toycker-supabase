"use client"

import React from "react"

import AccountInfo from "../account-info"
import { CustomerProfile } from "@/lib/supabase/types"

type MyInformationProps = {
  customer: CustomerProfile
}

const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  return (
    <div className="w-full" data-testid="account-email-editor">
      <AccountInfo
        label="Email"
        currentInfo={`${customer.email}`}
        clearState={() => {}}
        editable={false}
      />
      <p className="text-small-regular text-ui-fg-subtle mt-2">
        Email cannot be changed.
      </p>
    </div>
  )
}

export default ProfileEmail