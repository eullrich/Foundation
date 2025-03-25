import React, { useMemo } from "react";
import { DataTable } from "./ui/data-table";
import { Tag } from "../App"; // Import the Tag component from App.jsx

export function CompanyDataTable({ companies }) {
  // Define columns for the table
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Company",
        cell: ({ row }) => (
          <a 
            href={row.original.website} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="company-name"
          >
            {row.original.name}
          </a>
        ),
      },
      {
        accessorKey: "headline",
        header: "Headline",
      },
      {
        accessorKey: "founded",
        header: "Founded",
      },
      {
        id: "capabilities",
        header: "Capabilities",
        cell: ({ row }) => {
          const company = row.original;
          return (
            <div className="tags-cell">
              {company.web3_native && <Tag type="web3">Web3</Tag>}
              {company.inference_apis && <Tag type="inference">Inference APIs</Tag>}
              {company.custom_model_hosting && <Tag type="hosting">Custom Hosting</Tag>}
              {company.fine_tuning_pipeline && <Tag type="fine-tuning">Fine-tuning</Tag>}
              {company.rent_gpu_compute && <Tag type="gpu">GPU Compute</Tag>}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <DataTable 
      columns={columns} 
      data={companies} 
      filterPlaceholder="Search companies..."
      filterColumn="name"
    />
  );
}
