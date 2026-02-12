
import React, { useState, useEffect } from 'react';
import { TimeSlot, CompanyInfo, AppStep, BookingDetails } from './types';
import { fetchSlots, bookSlot, fetchConfig } from './services/googleSheetService';
import { getAIPersonnalizedGreeting } from './services/geminiService';
import SlotItem from './components/SlotItem';
import AdminPage from './components/AdminPage';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.WELCOME);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [config, setConfig] = useState<CompanyInfo | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [aiGreeting, setAiGreeting] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const loadInitialData = async () => {
    setIsLoading(true);
    setConnectionError(false);
    try {
      const [fetchedSlots, fetchedConfig] = await Promise.all([
        fetchSlots(),
        fetchConfig()
      ]);
      
      setSlots(fetchedSlots || []);
      if (fetchedConfig && fetchedConfig.name) {
        setConfig(fetchedConfig);
        getAIPersonnalizedGreeting(fetchedConfig).then(setAiGreeting);
      } else {
        // 데이터가 없으면 기본값으로 세팅
        setConfig({
          name: '면접 시스템',
          jobTitle: '준비 중인 공고',
          description: '',
          guidelines: ['안내 사항이 등록되지 않았습니다.']
        });
      }
    } catch (error: any) {
      console.error("데이터 로딩 실패:", error);
      setConnectionError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;

    setIsLoading(true);
    try {
      const success = await bookSlot({
        candidateName: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
        slotId: selectedSlotId
      });

      if (success) {
        setStep(AppStep.SUCCESS);
      } else {
        alert("이미 예약된 시간입니다. 다른 시간을 선택해주세요.");
        const updatedSlots = await fetchSlots();
        setSlots(updatedSlots);
        setSelectedSlotId(null);
        setStep(AppStep.SELECTION);
      }
    } catch (err) {
      alert("예약 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-xl w-full bg-white p-10 rounded-3xl shadow-2xl border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">구글 연동 오류가 감지되었습니다</h2>
          <div className="space-y-4 text-sm text-gray-600 mb-8">
            <p className="font-semibold text-red-600">다음 3가지를 확인해 주세요:</p>
            <ol className="list-decimal pl-5 space-y-3">
              <li><strong>배포 설정:</strong> 구글 앱 스크립트 배포 시 [액세스 권한이 있는 사용자]를 <span className="underline font-bold text-blue-600">"모든 사용자"(Anyone)</span>로 설정하셨나요?</li>
              <li><strong>권한 승인:</strong> 배포 과정에서 구글 계정 액세스 권한을 승인(Allow) 하셨나요?</li>
              <li><strong>코드 내용:</strong> doPost 함수가 포함된 전체 코드가 제대로 붙여넣기 되었나요?</li>
            </ol>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={loadInitialData} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">연결 재시도</button>
            <button onClick={() => { setConnectionError(false); setStep(AppStep.ADMIN); }} className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">관리자 설정으로 강제 진입</button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && step !== AppStep.SUCCESS) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-400 animate-pulse">데이터를 가져오는 중...</p>
        </div>
      </div>
    );
  }

  const selectedSlot = slots.find(s => s.id === selectedSlotId);
  const activeSlots = slots.filter(s => s.isActive);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-slate-50">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-blue-600 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16 blur-2xl"></div>
          <p className="text-blue-100 font-medium mb-1">{config?.name}</p>
          <h1 className="text-2xl md:text-3xl font-bold">{config?.jobTitle}</h1>
        </div>

        {/* Content Section */}
        <div className="p-6 md:p-10">
          {step === AppStep.ADMIN ? (
             <AdminPage onBack={loadInitialData} />
          ) : (
            <>
              {step === AppStep.WELCOME && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl">
                    <p className="text-blue-900 leading-relaxed font-medium italic">
                      "{aiGreeting || '면접 시간을 선택해 주세요.'}"
                    </p>
                  </div>
                  <div className="prose prose-blue">
                    <h3 className="text-lg font-bold text-gray-800">면접 안내 사항</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                      {config?.guidelines.map((g, idx) => <li key={idx}>{g}</li>)}
                    </ul>
                  </div>
                  <button onClick={() => setStep(AppStep.SELECTION)} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg transition-all">면접 시간 선택하기</button>
                </div>
              )}

              {step === AppStep.SELECTION && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900">면접 가능 시간대</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSlots.length > 0 ? (
                      activeSlots.map(slot => (
                        <SlotItem key={slot.id} slot={slot} isSelected={selectedSlotId === slot.id} onSelect={setSelectedSlotId} />
                      ))
                    ) : (
                      <div className="col-span-2 py-10 text-center text-gray-400 border-2 border-dashed rounded-xl">예약 가능한 시간이 없습니다.</div>
                    )}
                  </div>
                  <div className="pt-6 flex gap-3">
                    <button onClick={() => setStep(AppStep.WELCOME)} className="px-6 py-4 bg-gray-100 text-gray-600 font-semibold rounded-xl">이전</button>
                    <button disabled={!selectedSlotId} onClick={() => setStep(AppStep.CONFIRMATION)} className={`flex-1 py-4 font-bold rounded-xl shadow-lg ${selectedSlotId ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>다음 단계로</button>
                  </div>
                </div>
              )}

              {step === AppStep.CONFIRMATION && (
                <form onSubmit={handleBooking} className="space-y-4">
                  <div className="bg-blue-50 p-6 rounded-2xl mb-6">
                    <p className="text-xs text-blue-600 font-bold mb-1 uppercase">선택한 시간</p>
                    <div className="text-lg font-bold text-blue-900">{selectedSlot?.date} | {selectedSlot?.startTime}</div>
                  </div>
                  <input required placeholder="지원자 성함" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border" />
                  <input required type="email" placeholder="이메일" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border" />
                  <input required type="tel" placeholder="연락처" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border" />
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setStep(AppStep.SELECTION)} className="px-6 py-4 bg-gray-100 text-gray-600 font-semibold rounded-xl">취소</button>
                    <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg">예약 확정</button>
                  </div>
                </form>
              )}

              {step === AppStep.SUCCESS && (
                <div className="text-center py-10 space-y-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto text-3xl">✓</div>
                  <h2 className="text-2xl font-bold text-gray-900">예약 완료!</h2>
                  <p className="text-gray-600">{formData.name}님, {selectedSlot?.date} {selectedSlot?.startTime}에 뵙겠습니다.</p>
                  <button onClick={() => window.location.reload()} className="text-blue-600 font-semibold">처음으로</button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 border-t p-6 text-center">
          <button onClick={() => setStep(AppStep.ADMIN)} className="text-xs text-gray-400 hover:text-blue-600 underline">관리자 페이지 진입</button>
        </div>
      </div>
    </div>
  );
};

export default App;
