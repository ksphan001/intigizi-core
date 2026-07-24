import React from "react";
import { Plus } from "lucide-react";

function PageHeader({ title, buttonText, onButtonClick }) {
  const hasButton = buttonText && onButtonClick;

  return (
    // PERBAIKAN: Menambahkan 'w-full' untuk memastikan container mengambil lebar penuh,
    // sehingga 'justify-center' dapat berfungsi dengan benar.
    <div
      className={`w-full flex items-center mb-6 flex-wrap gap-4 ${hasButton ? "justify-between" : "justify-center"}`}
    >
      <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      {hasButton && (
        <button onClick={onButtonClick} className="btn-primary">
          <Plus size={20} className="mr-2" />
          {buttonText}
        </button>
      )}
    </div>
  );
}

export default PageHeader;
