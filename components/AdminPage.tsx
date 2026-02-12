
import React, { useState, useEffect } from 'react';
import { TimeSlot, CompanyInfo } from '../types';
import { fetchSlots, saveSlots, fetchConfig, saveConfig } from '../services/googleSheetService';

interface AdminPageProps {
  onBack: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [config, setConfig] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [s, c] = await Promise.all([fetchSlots(), fetchConfig()]);
        setSlots(s || []);
        if (c && c.name) setConfig(c);
        else setConfig({ name: '회사명', jobTitle: '직무명', description: '', guidelines: [] });
      } catch (err) {
        console.error("데이터 로드 실패");
        setConfig({ name: '', jobTitle: '', description: '', guidelines: [] });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveAll = async () => {
    setIsLoading(true);
    try {
      if (config) await saveConfig(config);
      await saveSlots(slots);
      alert('성공적으로 저장되었습니다!');
    } catch (err) {
      alert('저장 중 오류가 발생했습니다. 아래 "앱 스크립트 설정 가이드"를 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const gasCode = `function doPost(e) {
  var params = JSON.parse(e.postData.contents);
  var action = params.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss.getSheetByName("Slots")) ss.insertSheet("Slots");
  if (!ss.getSheetByName("Config")) ss.insertSheet("Config");
  
  var slotSheet = ss.getSheetByName("Slots");
  var configSheet = ss.getSheetByName("Config");
  var result = { success: true, data: null };

  try {
    if (action === "fetchSlots") {
      var data = slotSheet.getDataRange().getValues();
      result.data = data.length <= 1 ? [] : data.slice(1).map(row => ({
        id: row[0], date: row[1], startTime: row[2], endTime: row[3], 
        isBooked: row[4] === true || row[4] === "TRUE", bookedBy: row[5], isActive: row[6] === true || row[6] === "TRUE"
      }));
    } else if (action === "saveSlots") {
      slotSheet.clear();
      slotSheet.appendRow(["id", "date", "startTime", "endTime", "isBooked", "bookedBy", "isActive"]);
      params.slots.forEach(s => slotSheet.appendRow([s.id, s.date, s.startTime, s.endTime, s.isBooked, s.bookedBy, s.isActive]));
    } else if (action === "fetchConfig") {
      var data = configSheet.getDataRange().getValues();
      result.data = data.length <= 1 ? {} : { name: data[1][0], jobTitle: data[1][1], description: data[1][2], guidelines: JSON.parse(data[1][3]) };
    } else if (action === "saveConfig") {
      configSheet.clear();
      configSheet.appendRow(["name", "jobTitle", "description", "guidelines"]);
      configSheet.appendRow([params.config.name, params.config.jobTitle, params.config.description, JSON.stringify(params.config.guidelines)]);
    } else if (action === "bookSlot") {
      var data = slotSheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] == params.details.slotId && data[i][4] != true && data[i][4] != "TRUE") {
          slotSheet.getRange(i + 1, 5).setValue(true);
          slotSheet.getRange(i + 1, 6).setValue(params.details.candidateName + " (" + params.details.email + ")");
          break;
        }
      }
    }
  } catch (err) { result.success = false; result.error = err.toString(); }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}`;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold">관리자 설정</h2>
        <button onClick={onBack} className="text-gray-500 font-bold px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">뒤로가기</button>
      </div>

      <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 space-y-3">
        <h4 className="font-bold text-orange-800 flex items-center gap-2">
          <span>⚠️</span> 앱 스크립트 설정 가이드 (중요)
        </h4>
        <p className="text-sm text-orange-700">연동이 안 된다면 아래 버튼을 눌러 코드를 복사하고 구글 앱 스크립트에 덮어쓰기 하세요.</p>
        <button onClick={() => setShowCode(!showCode)} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
          {showCode ? "가이드 닫기" : "전체 코드 및 배포 방법 보기"}
        </button>
        
        {showCode && (
          <div className="mt-4 space-y-4 animate-in slide-in-from-top duration-300">
            <div className="bg-white p-4 rounded-xl border border-orange-100 text-xs text-gray-700">
              <p className="font-bold mb-2">1. 구글 앱 스크립트 설정:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>배포 유형: <strong>웹 앱</strong></li>
                <li>액세스 권한이 있는 사용자: <strong>모든 사용자 (Anyone)</strong></li>
                <li>사용자 이름: <strong>본인 (Me)</strong></li>
              </ul>
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-x-auto max-h-60">
              {gasCode}
            </pre>
            <button 
              onClick={() => { navigator.clipboard.writeText(gasCode); alert('코드가 복사되었습니다.'); }}
              className="w-full py-2 bg-gray-800 text-white rounded-lg text-xs font-bold"
            >
              코드 복사하기
            </button>
          </div>
        )}
      </div>

      {/* 기본 정보 설정 */}
      <section className="space-y-4">
        <h3 className="font-bold text-gray-700">채용 정보</h3>
        <input placeholder="회사명" value={config?.name} onChange={e => setConfig({...config!, name: e.target.value})} className="w-full p-3 border rounded-xl" />
        <input placeholder="직무" value={config?.jobTitle} onChange={e => setConfig({...config!, jobTitle: e.target.value})} className="w-full p-3 border rounded-xl" />
      </section>

      {/* 시간대 설정 */}
      <section className="space-y-4">
        <h3 className="font-bold text-gray-700">면접 시간 추가</h3>
        <div className="flex gap-2">
          <input type="date" value={newSlot.date} onChange={e => setNewSlot({...newSlot, date: e.target.value})} className="flex-1 p-2 border rounded-lg text-sm" />
          <input type="time" value={newSlot.startTime} onChange={e => setNewSlot({...newSlot, startTime: e.target.value})} className="w-24 p-2 border rounded-lg text-sm" />
          <button onClick={() => {
            setSlots([...slots, { id: Date.now().toString(), date: newSlot.date, startTime: newSlot.startTime, endTime: '', isBooked: false, isActive: true }]);
          }} className="bg-blue-600 text-white px-4 rounded-lg font-bold">+</button>
        </div>
        
        <div className="border rounded-xl overflow-hidden text-sm">
          {slots.map(s => (
            <div key={s.id} className="p-3 border-b flex justify-between items-center bg-white">
              <div>{s.date} <span className="font-bold">{s.startTime}</span></div>
              <div className="flex gap-2">
                <span className={s.isBooked ? "text-red-500" : "text-green-500"}>{s.isBooked ? "예약됨" : "대기"}</span>
                <button onClick={() => setSlots(slots.filter(x => x.id !== s.id))} className="text-red-400">삭제</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button 
        onClick={handleSaveAll}
        disabled={isLoading}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-xl disabled:bg-gray-300"
      >
        {isLoading ? "저장 중..." : "모든 변경 사항 저장"}
      </button>
    </div>
  );
};

export default AdminPage;
