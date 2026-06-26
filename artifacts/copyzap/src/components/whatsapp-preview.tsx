import { Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhatsAppPreviewProps {
  message: string;
  clientName: string;
}

export function WhatsAppPreview({ message, clientName }: WhatsAppPreviewProps) {
  const now = format(new Date(), "HH:mm", { locale: ptBR });

  return (
    <div className="rounded-xl overflow-hidden border border-[#25D366]/20 shadow-lg shadow-[#25D366]/5">
      <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
          {clientName.charAt(0).toUpperCase() || "?"}
        </div>
        <div>
          <p className="text-white text-sm font-medium">{clientName || "Cliente"}</p>
          <p className="text-[#8696a0] text-xs">online</p>
        </div>
      </div>

      <div
        className="p-4 min-h-[120px] relative"
        style={{
          backgroundColor: "#0b141a",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="max-w-[85%] ml-auto">
          <div className="bg-[#005c4b] rounded-lg rounded-tr-none px-3 py-2 shadow-md">
            <p className="text-[#e9edef] text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[#8696a0] text-[10px]">{now}</span>
              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
        <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-[#8696a0] text-sm">
          Mensagem
        </div>
        <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
