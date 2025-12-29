import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface DetailPageProps {
  selectedDate: Date;
  onBack: () => void;
}

export default function DetailPage({ selectedDate, onBack }: DetailPageProps) {
  const formattedDate = selectedDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>

        <h1 className="text-2xl font-semibold mb-4" data-testid="text-selected-date">
          {formattedDate}
        </h1>

        <div className="space-y-4">
          <p className="text-muted-foreground" data-testid="text-detail-placeholder">
            이 날짜의 상세 내용을 여기에 표시합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
