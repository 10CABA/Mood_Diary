document.addEventListener('DOMContentLoaded', function() {
    // Variables
    var moodButtons = document.querySelectorAll('#mood-selector .mood-btn')
    var noteInput = document.getElementById('note-input')
    var charCount = document.getElementById('char-count')
    var addEntryBtn = document.getElementById('add-entry-btn')
    var dateFromInput = document.getElementById('date-from')
    var dateToInput = document.getElementById('date-to')
    var filterBtn = document.getElementById('filter-btn')
    var resetFilterBtn = document.getElementById('reset-filter-btn')
    var entriesContainer = document.getElementById('entries-container')
    var notificationContainer = document.getElementById('notification-container')
    var statAvg = document.getElementById('stat-avg')
    var statMax = document.getElementById('stat-max')
    var statMin = document.getElementById('stat-min')
    var statTotal = document.getElementById('stat-total')
    var moodChart = document.getElementById('mood-chart')
    
    // Edit
    var editModal = document.getElementById('edit-modal')
    var modalMoodButtons = document.querySelectorAll('#modal-mood-selector .mood-btn')
    var modalNoteInput = document.getElementById('modal-note-input')
    var modalCharCount = document.getElementById('modal-char-count')
    var modalDate = document.getElementById('modal-date')
    var modalSaveBtn = document.getElementById('modal-save-btn')
    var modalCancelBtn = document.getElementById('modal-cancel-btn')


    var STORAGE_KEY = 'moodTable_v1.3.1'
    var entries = loadEntries()
    var selectedMood = 0
    var modalSelectedMood = 0
    var editingEntryId = null

    
    function loadEntries() {
        var stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return []
        try {
            return JSON.parse(stored)
        } catch (error) {
            return []
        }
    }

    function saveEntries() {localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))}
    function generateId() {return 'e_' + Date.now() + '_' + Math.floor(Math.random() * 10000)}

    function getTodayDate() {
        var d = new Date()
        var year = d.getFullYear()
        var month = d.getMonth() + 1
        var day = d.getDate()

        if (month < 10) month = '0' + month
        if (day < 10) day = '0' + day;

        return year + '-' + month + '-' + day
    }

    function getDateString(dateObj) {
        var year = dateObj.getFullYear()
        var month = dateObj.getMonth() + 1
        var day = dateObj.getDate()

        if (month < 10) month = '0' + month
        if (day < 10) day = '0' + day

        return year + '-' + month + '-' + day
    }

    function getEmoji(mood) {
        if (mood == 5) return '😃'
        if (mood == 4) return '😊'
        if (mood == 3) return '😐'
        if (mood == 2) return '🙁'
        if (mood == 1) return '😡'
        return '❓';
    }

    // Увидомления
    function showNotification(message, type) {
        notificationContainer.innerHTML = ''
        var notif = document.createElement('div')
        
        if (type === 'error') {
            notif.className = 'notification notification-error';
        } else {
            notif.className = 'notification notification-success';
        }
        
        notif.innerHTML = 
            '<span class="notif-text">' + message + '</span>' +
            '<button class="notif-close-btn">×</button>';
        
        notificationContainer.appendChild(notif);
        
        var closeBtn = notif.querySelector('.notif-close-btn')
        closeBtn.addEventListener('click', function() {
            hideAndRemove(notif)
        })
        
        setTimeout(function() {
            if (notif.parentElement) {
                hideAndRemove(notif)
            }
        }, 3000);
    }

    function hideAndRemove(element) {
        element.style.opacity = '0'
        element.style.transform = 'translateY(-20px)'

        setTimeout(function() {if (element.parentElement) {element.remove()}
        }, 300)
    }

    function hasTodayEntry() {
        var today = getTodayDate()
        for (var i = 0; i < entries.length; i++) {if (entries[i].date === today) {return true}}
        return false
    }

    function setupMoodButtons(buttons, callback) {
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function() {

                for (var j = 0; j < buttons.length; j++) {buttons[j].classList.remove('active')}
                this.classList.add('active');
                var moodValue = parseInt(this.dataset.mood)

                if (callback) {callback(moodValue)}
            })
        }
    }

    // Добавление заметок
    function addEntry() {
        if (selectedMood === 0 || !selectedMood) {
            showNotification('❌ Выберите настроение!', 'error')
            return
        }
        
        if (hasTodayEntry()) {
            showNotification('❌ Вы уже добавили запись сегодня!', 'error')
            return
        }
        
        var note = noteInput.value.trim();
        if (note.length > 200) {
            showNotification('❌ Максимум 200 символов!')
            return
        }
        
        var newEntry = {
            id: generateId(),
            date: getTodayDate(),
            mood: selectedMood,
            note: note
        }
        
        entries.push(newEntry)
        entries.sort(function(a, b) {
            if (a.date > b.date) return -1;
            if (a.date < b.date) return 1;
            return 0
        })
        
        saveEntries();
        noteInput.value = ''
        updateCharCount()
        renderApp()
        showNotification('✅ Запись добавлена!', 'success')
    }

    function renderEntries(list) {
        entriesContainer.innerHTML = ''
        
        if (list.length === 0) {
            entriesContainer.innerHTML = 
            '<div class="empty-state"><span class="empty-icon">📝</span><p>Нет записей</p></div>'
            return
        }
        
        for (var i = 0; i < list.length; i++) {
            var entry = list[i]
            var emoji = getEmoji(entry.mood)
            var isToday = (entry.date === getTodayDate())
            
            var cardHTML = ''
            cardHTML += '<div class="entry-card" data-id="' + entry.id + '">'
            cardHTML += '  <div class="mood-emoji-big">' + emoji + '</div>'
            cardHTML += '  <div class="entry-info">'
            cardHTML += '    <div class="entry-date">' + entry.date
            if (isToday) {
                cardHTML += ' <span class="today-badge">(сегодня)</span>'
            }
            cardHTML += '    </div>'
            cardHTML += '    <div class="entry-note">' + (entry.note || 'Без заметки') + '</div>'
            cardHTML += '  </div>'
            cardHTML += '  <div class="entry-right">';
            cardHTML += '    <div class="entry-grade">' + entry.mood + '/5</div>'
            
            // Edit btns - только сегодняшней день
            if (isToday) {
                cardHTML += '    <div class="entry-actions">'
                cardHTML += '      <button class="icon-btn edit-btn" data-id="' + entry.id + '" title="Редактировать">'
                cardHTML += '        <img src="imgs/Dots.png" alt="ред" width="16" height="16">'
                cardHTML += '      </button>'
                cardHTML += '      <button class="icon-btn delete-btn" data-id="' + entry.id + '" title="Удалить">×</button>'
                cardHTML += '    </div>'
            }
            
            cardHTML += '  </div>'
            cardHTML += '</div>'
            
            entriesContainer.innerHTML += cardHTML
        }
        
        var editButtons = document.querySelectorAll('.edit-btn')
        for (var e = 0; e < editButtons.length; e++) {
            editButtons[e].addEventListener('click', function() {
                var entryId = this.dataset.id
                openEditModal(entryId)
            })
        }
        
        var deleteButtons = document.querySelectorAll('.delete-btn');
        for (var d = 0; d < deleteButtons.length; d++) {
            deleteButtons[d].addEventListener('click', function() {
                var entryId = this.dataset.id

                if (confirm('Удалить эту запись?')) {deleteEntry(entryId)}
            });
        }
    }

    // Поиск записи
    function findEntryById(id) {
        for (var i = 0; i < entries.length; i++) {if (entries[i].id === id) {return entries[i]}}
        return null
    }

    // Edit list
    function openEditModal(entryId) {
        var entry = findEntryById(entryId)
        if (!entry) return
        
        editingEntryId = entryId
        modalDate.textContent = 'Дата: ' + entry.date
        modalNoteInput.value = entry.note
        modalCharCount.textContent = entry.note.length + '/200'
        modalSelectedMood = entry.mood
      
        var modalBtn = document.querySelector('#modal-mood-selector [data-mood="' + entry.mood + '"]')

        if (modalBtn) {modalBtn.click()}
        editModal.style.display = 'flex'
    }

    function closeEditModal() {
        editModal.style.display = 'none'
        editingEntryId = null
    }

    function saveEdit() {
        var entry = findEntryById(editingEntryId)
        if (!entry) return
        
        entry.mood = modalSelectedMood
        entry.note = modalNoteInput.value.trim()
        
        saveEntries()
        closeEditModal()
        renderApp()
        
        showNotification('✅ Запись обновлена!', 'success');
    }

    function deleteEntry(entryId) {
        var newEntries = []

        for (var i = 0; i < entries.length; i++) {if (entries[i].id !== entryId) {newEntries.push(entries[i])}}
        entries = newEntries

        saveEntries()
        renderApp()
        showNotification('🗑️ Запись удалена.', 'success')
    }

    // Stats
    function updateStats(list) {
        if (list.length === 0) {
            statAvg.textContent = '-'
            statMax.textContent = '-'
            statMin.textContent = '-'
            statTotal.textContent = '0'
            return
        }
        
        var moods = []

        for (var i = 0; i < list.length; i++) {moods.push(list[i].mood)}
        statTotal.textContent = list.length
        var sum = 0

        for (var j = 0; j < moods.length; j++) {sum += moods[j]}
        statAvg.textContent = (sum / moods.length).toFixed(1)
        statMax.textContent = Math.max.apply(null, moods)
        statMin.textContent = Math.min.apply(null, moods)
    }

    // График
    function drawChart(list) {
        var days = [];
        for (var i = 6; i >= 0; i--) {
            var d = new Date()
            d.setDate(d.getDate() - i)
            days.push(getDateString(d))
        }
        
        var moodByDay = {}
        for (var i = 0; i < list.length; i++) {
            var entry = list[i]
            if (days.indexOf(entry.date) !== -1) {
                if (!moodByDay[entry.date]) {moodByDay[entry.date] = []}
                moodByDay[entry.date].push(entry.mood)
            }
        }
        
        var chartText = '';
        for (var j = 0; j < days.length; j++) {
            var date = days[j]
            var shortDate = date.slice(5)
            
            if (moodByDay[date]) {
                var sum = 0
                var dayMoods = moodByDay[date]

                for (var k = 0; k < dayMoods.length; k++) {sum += dayMoods[k]}
                var avgMood = sum / dayMoods.length
                var bar = ''
                var barLength = Math.round(avgMood * 4)

                for (var b = 0; b < barLength; b++) {bar += '▮'}
                chartText += shortDate + ' | ' + bar + ' ' + avgMood.toFixed(1) + '\n'

            } else {
                chartText += shortDate + ' | (нет данных)\n'
            }
        }
        
        moodChart.textContent = chartText || 'Нет данных'
    }

    function applyFilter() {
        var from = dateFromInput.value;
        var to = dateToInput.value;
        
        if (!from || !to) {
            showNotification('❌ Выберите обе даты!', 'error')
            return
        }
        
        var filtered = [];
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].date >= from && entries[i].date <= to) {
                filtered.push(entries[i])
            }
        }
        
        renderApp(filtered)
    }

    function resetFilter() {
        dateToInput.value = getTodayDate()
        var weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 6)
        dateFromInput.value = getDateString(weekAgo)
        renderApp(entries)
    }

    function updateCharCount() {
        var length = noteInput.value.length
        charCount.textContent = length + '/200'
    }

    function updateModalCharCount() {
        var length = modalNoteInput.value.length
        modalCharCount.textContent = length + '/200'
    }

    function renderApp(list) {
        var dataToShow = list || entries;
        renderEntries(dataToShow);
        updateStats(dataToShow);
        drawChart(dataToShow);
    }



    setupMoodButtons(moodButtons, function(mood) {selectedMood = mood})
    setupMoodButtons(modalMoodButtons, function(mood) {modalSelectedMood = mood})
    
    addEntryBtn.addEventListener('click', addEntry)
    filterBtn.addEventListener('click', applyFilter)
    resetFilterBtn.addEventListener('click', resetFilter)
    noteInput.addEventListener('input', updateCharCount)
    
    modalSaveBtn.addEventListener('click', saveEdit)
    modalCancelBtn.addEventListener('click', closeEditModal)
    modalNoteInput.addEventListener('input', updateModalCharCount)
    
    editModal.addEventListener('click', function(event) {if (event.target === editModal) {closeEditModal()}})
    dateToInput.value = getTodayDate()

    var weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 6)
    dateFromInput.value = getDateString(weekAgo)

    renderApp()
})