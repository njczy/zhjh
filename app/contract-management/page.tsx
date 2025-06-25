"use client"

import ContractManagement from "@/components/contract-management"
import { useUser } from "@/contexts/UserContext"

export default function ContractManagementPage() {
  const { currentUser } = useUser()
  
  return (
    <div className="h-full">
      <ContractManagement currentUser={currentUser} />
    </div>
  )
} 