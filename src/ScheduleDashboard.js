import { useState, useEffect } from 'react';

import {
  ClockIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  CheckIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

import { scheduleService, timeOffService } from './api';



// Mock data - would come from API in real implementation
const mockScheduleData = {
  Sunday: { startTime: '09:00', endTime: '17:30' },
  Monday: { startTime: '09:00', endTime: '17:30' },
  Tuesday: { startTime: '09:00', endTime: '17:30' },
  Wednesday: { startTime: '09:00', endTime: '17:30' },
  Thursday: { startTime: '09:00', endTime: '17:30' }
};

const mockTimeOffData = [
  { id: 1, type: 'vacation', startDate: '2025-05-15', endDate: '2025-05-20', description: 'Summer vacation' },
  { id: 2, type: 'dayOff', startDate: '2025-06-01', endDate: '2025-06-01', description: 'Personal day' }
];



export default function ScheduleDashboard() {
  const [scheduleData, setScheduleData] = useState(mockScheduleData);
  const [timeOffData, setTimeOffData] = useState(mockTimeOffData);
  const [newTimeOff, setNewTimeOff] = useState({
    type: 'vacation',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [editingTimeOff, setEditingTimeOff] = useState(null);
  const [notification, setNotification] = useState(null);

  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const schedule = await scheduleService.getSchedule();
        setScheduleData(schedule);
        
        const timeOff = await timeOffService.getAllTimeOff();
        setTimeOffData(timeOff);
      } catch (error) {
        console.error('Error fetching data:', error);
        showNotification('Failed to load data. Please try again later.', 'error');
      }finally{
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleScheduleChange = (day, field, value) => {
    setScheduleData({
      ...scheduleData,
      [day]: { ...scheduleData[day], [field]: value }
    });
  };

  const handleUpdateSchedule = async () => {
    isLoading(true);
    try {
      await scheduleService.updateSchedule(scheduleData);
      showNotification('Schedule updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating schedule:', error);
      showNotification('Failed to update schedule. Please try again.', 'error');
    }finally{
      isLoading(false);
    }
  };

  const handleTimeOffInputChange = (field, value) => {
    setNewTimeOff(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'type' && value === 'dayOff') updated.endDate = prev.startDate;
      if (field === 'startDate' && prev.type === 'dayOff') updated.endDate = value;
      return updated;
    });
  };

  const handleAddTimeOff = async () => {
    if (!newTimeOff.startDate) {
      showNotification('Please select a start date', 'error');
      return;
    }
    if (newTimeOff.type === 'vacation') {
      if (!newTimeOff.endDate) {
        showNotification('Please select an end date', 'error');
        return;
      }
      if (newTimeOff.endDate < newTimeOff.startDate) {
        showNotification('End date must be after start date', 'error');
        return;
      }
    }

    console.log('Adding new time off:', newTimeOff);
    isLoading(true);
    try {
      const newEntry = await timeOffService.addTimeOff(newTimeOff);
      setTimeOffData([...timeOffData, newEntry]);
      setNewTimeOff({ type: 'vacation', startDate: '', endDate: '', description: '' });
      showNotification('Time off added successfully!', 'success');
    } catch (error) {
      console.error('Error adding time off:', error);
      showNotification('Failed to add time off. Please try again.', 'error');
    }finally{
      isLoading(false);
    }
  };

  const handleEditTimeOff = (id) => {
    const timeOff = timeOffData.find(item => item.id === id);
    if (timeOff) setEditingTimeOff(timeOff);
  };

  const handleSaveTimeOff = async () => {
    if (!editingTimeOff.startDate) {
      showNotification('Please select a start date', 'error');
      return;
    }
    if (editingTimeOff.type === 'vacation') {
      if (!editingTimeOff.endDate) {
        showNotification('Please select an end date', 'error');
        return;
      }
      if (editingTimeOff.endDate < editingTimeOff.startDate) {
        showNotification('End date must be after start date', 'error');
        return;
      }
    }
    isLoading(true);
    try {
      const updatedEntry = await timeOffService.updateTimeOff(editingTimeOff.id, editingTimeOff);
      setTimeOffData(timeOffData.map(item => item.id === updatedEntry.id ? updatedEntry : item));
      setEditingTimeOff(null);
      showNotification('Time off updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating time off:', error);
      showNotification('Failed to update time off. Please try again.', 'error');
    }finally{
      isLoading(false);
    }
  };

  const handleDeleteTimeOff = async (id) => {
    if (window.confirm('Are you sure you want to delete this time off entry?')) {
      isLoading(true);
      try {
        await timeOffService.deleteTimeOff(id);
        setTimeOffData(timeOffData.filter(item => item.id !== id));
        showNotification('Time off deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting time off:', error);
        showNotification('Failed to delete time off. Please try again.', 'error');
      }finally{
        isLoading(false);
      }
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatTime = (time24h) => {
    const [hours, minutes] = time24h.split(':');
    const hour = parseInt(hours, 10);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minutes} ${suffix}`;
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    if (startDate === endDate) return start.toLocaleDateString('en-US', options);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {notification && (
          <div className={`mb-8 p-4 rounded-lg shadow-md flex items-center animate-fade-in ${
            notification.type === 'success' ? 'bg-green-100 text-green-900' :
            notification.type === 'error' ? 'bg-red-100 text-red-900' :
            'bg-blue-100 text-blue-900'
          }`}>
            {notification.type === 'success' && <CheckIcon className="w-6 h-6 mr-3" />}
            {notification.type === 'error' && <XMarkIcon className="w-6 h-6 mr-3" />}
            {notification.type === 'info' && <ExclamationCircleIcon className="w-6 h-6 mr-3" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {/* Weekly Schedule Section */}
        <section className="bg-white rounded-xl shadow-lg mb-10 overflow-hidden">
          <div className="px-6 py-5 bg-gray-50 border-b border-gray-200 flex items-center">
            <ClockIcon className="w-6 h-6 mr-3 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Weekly Working Hours</h2>
          </div>
          <div className="px-6 py-4 bg-amber-50 flex items-start">
            <ExclamationCircleIcon className="w-6 h-6 mr-3 text-amber-600 mt-1" />
            <p className="text-sm text-amber-800">
              Note: Registration hours on Synarion may differ by 10 minutes.
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
              {Object.keys(scheduleData).map(day => (
                <div key={day} className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{day}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={scheduleData[day].startTime}
                        onChange={(e) => handleScheduleChange(day, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                      <p className="mt-1 text-xs text-gray-600">{formatTime(scheduleData[day].startTime)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={scheduleData[day].endTime}
                        onChange={(e) => handleScheduleChange(day, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                      <p className="mt-1 text-xs text-gray-600">{formatTime(scheduleData[day].endTime)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                disabled={isLoading}
                onClick={handleUpdateSchedule}
                className="bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all flex items-center"
              >
                {isLoading && (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <CheckIcon className="w-5 h-5 mr-2" />
                Update Hours
              </button>
            </div>
          </div>
        </section>

        {/* Time Off Section */}
        <section className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 bg-gray-50 border-b border-gray-200 flex items-center">
            <CalendarIcon className="w-6 h-6 mr-3 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Vacations & Days Off</h2>
          </div>

          {/* Add New Time Off */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-5">Add New Time Off</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newTimeOff.type}
                  onChange={(e) => handleTimeOffInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="vacation">Vacation</option>
                  <option value="dayOff">Day Off</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newTimeOff.startDate}
                  onChange={(e) => handleTimeOffInputChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {newTimeOff.type === 'vacation' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newTimeOff.endDate}
                    onChange={(e) => handleTimeOffInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newTimeOff.description}
                  onChange={(e) => handleTimeOffInputChange('description', e.target.value)}
                  placeholder="E.g., Family vacation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                disabled={isLoading}
                onClick={handleAddTimeOff}
                className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all flex items-center"
              >
              {isLoading && (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
                <CheckIcon className="w-5 h-5 mr-2" />
                Add Time Off
              </button>
            </div>
          </div>

          {/* Time Off List */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-5">Your Scheduled Time Off</h3>
            {timeOffData.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <CalendarIcon className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                <p className="text-lg">No time off scheduled yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {[...timeOffData].sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).map(item => (
                  <li key={item.id} className="py-4 hover:bg-gray-50 transition-colors">
                    {editingTimeOff && editingTimeOff.id === item.id ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={editingTimeOff.type}
                            onChange={(e) => setEditingTimeOff({
                              ...editingTimeOff,
                              type: e.target.value,
                              endDate: e.target.value === 'dayOff' ? editingTimeOff.startDate : editingTimeOff.endDate
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="vacation">Vacation</option>
                            <option value="dayOff">Day Off</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={editingTimeOff.startDate}
                            onChange={(e) => setEditingTimeOff({
                              ...editingTimeOff,
                              startDate: e.target.value,
                              endDate: editingTimeOff.type === 'dayOff' ? e.target.value : editingTimeOff.endDate
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        {editingTimeOff.type === 'vacation' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                              type="date"
                              value={editingTimeOff.endDate}
                              onChange={(e) => setEditingTimeOff({ ...editingTimeOff, endDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            value={editingTimeOff.description}
                            onChange={(e) => setEditingTimeOff({ ...editingTimeOff, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="col-span-full flex justify-end space-x-3">
                          <button
                            disabled={isLoading}
                            onClick={() => setEditingTimeOff(null)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={isLoading}
                            onClick={handleSaveTimeOff}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              item.type === 'vacation' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {item.type === 'vacation' ? 'Vacation' : 'Day Off'}
                            </span>
                            {item.description && (
                              <span className="text-sm text-gray-600">{item.description}</span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-gray-700">{formatDateRange(item.startDate, item.endDate)}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            disabled={isLoading}
                            onClick={() => handleEditTimeOff(item.id)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            disabled={isLoading}
                            onClick={() => handleDeleteTimeOff(item.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
      `}</style>
    </div>
  );
}