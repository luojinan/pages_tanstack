import { useEffect, useState } from "react";
import { X } from "lucide-react";

const NOT_NEED_LIST = [
  "日抛",
  "精油",
  "精华",
  "香水",
  "车走",
  "面霜",
  "身体乳",
  "申删",
  "母婴",
  "隔离",
  "美瞳",
  "【删】",
  "【交流】",
  "月抛",
  "腮红",
  "🚗走",
  "🚗跑",
  "小金管",
  "抗糖小白瓶",
  "眼霜",
  "面膜",
  "气垫",
  "双萃",
  "双抗",
];

interface BlacklistItem {
  name: string;
  disabled: boolean;
}

const STORAGE_KEY = "blacklist";

interface BlacklistProps {
  onRefreshList: (blacklist: BlacklistItem[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Blacklist = ({ onRefreshList, isOpen, onClose }: BlacklistProps) => {
  // 从 localStorage 获取初始数据
  const initialData = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>(initialData);
  const [newEntry, setNewEntry] = useState("");

  useEffect(() => {
    if (initialData.length === 0) {
      const defaultList = NOT_NEED_LIST.map((item) => ({ name: item, disabled: false }));
      setBlacklist(defaultList);
    }
  }, []);

  // 实时存储输入框数据到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blacklist));
    const activeFilters = blacklist.filter((item) => !item.disabled);
    console.log("Blacklist updated:", blacklist);
    console.log("Active filters:", activeFilters);
    onRefreshList(activeFilters);
  }, [blacklist]);

  const handleAdd = () => {
    if (newEntry.trim() !== "") {
      const updatedList = [{ name: newEntry, disabled: true }, ...blacklist];
      setBlacklist(updatedList);
      setNewEntry("");
    }
  };

  const handleDelete = (index) => {
    const filteredList = blacklist.filter((item, idx) => idx !== index);
    setBlacklist(filteredList);
  };

  const handleToggleDisabled = (index) => {
    const updatedList = [...blacklist];
    updatedList[index].disabled = !updatedList[index].disabled;
    setBlacklist(updatedList);
  };

  const handleInputChange = (index, value) => {
    const updatedList = [...blacklist];
    updatedList[index].name = value;
    setBlacklist(updatedList);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? "opacity-50" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">不感兴趣关键字</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close blacklist settings"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-600 mb-4">
            用于过滤不想看的作业，修改实时保存并过滤，不需要刷新
          </p>

          <div className="flex items-center mb-6 mt-1">
            <input
              type="text"
              className="input input-bordered w-full max-w-xs"
              placeholder="输入后点击右侧"
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
            />
            <button className="btn btn-primary ml-2" onClick={handleAdd}>
              ➕
            </button>
          </div>

          {blacklist.map((item, index) => (
            <div key={index} className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{index + 1}.</span>
              <input
                type="text"
                value={item.name}
                placeholder="输入关键词"
                className="input input-bordered input-sm w-full max-w-xs mx-1"
                onChange={(e) => handleInputChange(index, e.target.value)}
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={!item.disabled}
                  onChange={() => handleToggleDisabled(index)}
                />
                <button
                  className="btn btn-sm btn-error ml-2"
                  onClick={() => handleDelete(index)}
                >
                  ⌫
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Blacklist;
