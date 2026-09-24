(() => {
    const STORAGE_KEY = "supportTickets";

    const STATUS = {
        new: {
            label: "Новая заявка",
            className: "status-new"
        },
        rejected: {
            label: "Отклоненная заявка",
            className: "status-rejected"
        },
        resolved: {
            label: "Решенная заявка",
            className: "status-resolved"
        }
    };

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function loadTickets() {
        try {
            const savedTickets = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

            if (!Array.isArray(savedTickets)) {
                return [];
            }

            return savedTickets
                .filter((ticket) => ticket && ticket.title && ticket.description)
                .map((ticket) => ({
                    id: String(ticket.id || createId()),
                    title: String(ticket.title),
                    description: String(ticket.description),
                    status: STATUS[ticket.status] ? ticket.status : "new",
                    createdAt: ticket.createdAt || new Date().toISOString()
                }));
        } catch (error) {
            return [];
        }
    }

    function saveTickets(tickets) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
            return true;
        } catch (error) {
            return false;
        }
    }

    function formatDate(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Дата не указана";
        }

        return new Intl.DateTimeFormat("ru-RU", {
            dateStyle: "medium",
            timeStyle: "short"
        }).format(date);
    }

    function getTicketCountText(count) {
        if (count === 0) {
            return "Заявок пока нет";
        }

        const lastDigit = count % 10;
        const lastTwoDigits = count % 100;
        let noun = "заявок";

        if (lastDigit === 1 && lastTwoDigits !== 11) {
            noun = "заявка";
        } else if (
            [2, 3, 4].includes(lastDigit) &&
            ![12, 13, 14].includes(lastTwoDigits)
        ) {
            noun = "заявки";
        }

        return `${count} ${noun}`;
    }

    function showFormMessage(message, type) {
        const formNote = document.querySelector(".form-note");

        if (!formNote) {
            return;
        }

        formNote.textContent = message;
        formNote.dataset.state = type || "";
    }

    function initForm() {
        const form = document.querySelector("#ticket-form");

        if (!form) {
            return;
        }

        const titleInput = form.querySelector("#ticket-title");
        const descriptionInput = form.querySelector("#ticket-description");

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const title = titleInput.value.trim();
            const description = descriptionInput.value.trim();

            if (!title) {
                showFormMessage("Введите заголовок обращения", "error");
                titleInput.focus();
                return;
            }

            if (!description) {
                showFormMessage("Опишите проблему в тексте обращения", "error");
                descriptionInput.focus();
                return;
            }

            const tickets = loadTickets();
            tickets.unshift({
                id: createId(),
                title,
                description,
                status: "new",
                createdAt: new Date().toISOString()
            });

            if (!saveTickets(tickets)) {
                showFormMessage("Не удалось сохранить заявку в браузере", "error");
                return;
            }

            form.reset();
            showFormMessage("Заявка отправлена и сохранена в браузере", "success");
        });
    }

    function createTicketCard(ticket, template) {
        const status = STATUS[ticket.status] || STATUS.new;
        const card = template.content.firstElementChild.cloneNode(true);

        card.className = `ticket-card ${status.className}`;
        card.querySelector(".status-label").textContent = status.label;
        card.querySelector(".ticket-title").textContent = ticket.title;
        card.querySelector(".ticket-description").textContent = ticket.description;

        const date = card.querySelector(".ticket-date");
        date.textContent = formatDate(ticket.createdAt);
        date.dateTime = ticket.createdAt;

        card.querySelector(".reject-button").addEventListener("click", () => {
            updateTicketStatus(ticket.id, "rejected");
        });

        card.querySelector(".resolve-button").addEventListener("click", () => {
            updateTicketStatus(ticket.id, "resolved");
        });

        return card;
    }

    function getAdminElements() {
        const ticketsList = document.querySelector("#tickets-list");
        const template = document.querySelector("#ticket-card-template");

        if (!ticketsList || !template) {
            return null;
        }

        return {
            ticketsList,
            template,
            emptyState: document.querySelector("#tickets-empty"),
            ticketCount: document.querySelector("#ticket-count")
        };
    }

    function renderTickets() {
        const elements = getAdminElements();

        if (!elements) {
            return;
        }

        const tickets = loadTickets().sort((first, second) => {
            return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
        });

        elements.ticketsList.replaceChildren(
            ...tickets.map((ticket) => createTicketCard(ticket, elements.template))
        );

        if (elements.emptyState) {
            elements.emptyState.hidden = tickets.length > 0;
        }

        elements.ticketsList.hidden = tickets.length === 0;

        if (elements.ticketCount) {
            elements.ticketCount.textContent = getTicketCountText(tickets.length);
        }
    }

    function updateTicketStatus(ticketId, nextStatus) {
        if (!STATUS[nextStatus]) {
            return;
        }

        const tickets = loadTickets();
        const ticket = tickets.find((item) => item.id === ticketId);

        if (!ticket) {
            return;
        }

        ticket.status = nextStatus;
        ticket.updatedAt = new Date().toISOString();
        saveTickets(tickets);
        renderTickets();
    }

    function init() {
        initForm();
        renderTickets();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
