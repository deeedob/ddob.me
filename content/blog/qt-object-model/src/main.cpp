// @section-start:task
#include <QtCore/QObject>
#include <QtCore/QString>
#include <QtCore/QTime>

class Task : public QObject
{
    Q_OBJECT

public:
    Task(QString name_, QObject* parent = nullptr)
        : QObject(parent), name(std::move(name_)) { }
    ~Task() override = default;
    Q_DISABLE_COPY_MOVE_X(Task, "QObjects are identities!")

    const QString name;

signals:
    void finished();

public slots:
    virtual void start() {
        qInfo("%s: Started Task { name: %s }",
            qPrintable(QTime::currentTime().toString("hh:mm:ss:zzz")),
            qPrintable(name)
        );
        emit finished();
    }
};

// @section-end:task

// @section-start:processor
#include <QtCore/QMetaMethod>
#include <QtCore/QMetaObject>
#include <QtCore/QThread>

void genericObjectProcessor(QObject &object,
                            Qt::ConnectionType connectionType = Qt::AutoConnection)
{
    const auto *metaObj = object.metaObject();
    const QString className = metaObj->className();
    qInfo() << "\nGeneric processor on class:" << className;

    // Set any 'singleShot' property to true
    if (object.setProperty("singleShot", true))
        qInfo() << "Property singleShot set to true on class:" << className;

    // Connect to anything with a 'finished()' signal.
    if (const auto index = metaObj->indexOfSignal("finished()"); index != -1) {
        const auto signal = metaObj->method(index);
        QMetaObject::connect(&object, signal, &object, [className](){
            qInfo() << "Emitting finished() on class:" << className;
        }, connectionType);
    }

    // Invoke anything with a 'start()' slot.
    if (const auto index = metaObj->indexOfSlot("start()"); index != -1) {
        qInfo() << "Calling start() on class:" << className;
        const auto slot = metaObj->method(index);
        slot.invoke(&object, connectionType);
    }

    // Quit and wait the QThread class explicitly.
    if (auto *thread = qobject_cast<QThread*>(&object)) {
        thread->quit();
        thread->wait();
    }
}
// @section-end:processor

// @section-start:eventTask

#include <QtCore/QEvent>
#include <chrono>

class DeadlineTask : public Task
{
    Q_OBJECT

public:
    DeadlineTask(std::chrono::milliseconds deadline_, QString name,
                QObject *parent = nullptr)
        : Task(std::move(name), parent), deadline(deadline_) {
    }
    ~DeadlineTask() override = default;
    Q_DISABLE_COPY_MOVE(DeadlineTask)

    const std::chrono::milliseconds deadline;

    void timerEvent(QTimerEvent *event) override
    {
        auto id = event->id();
        if (mActiveTimerIds.remove(id)) {
            QObject::killTimer(id);
            Task::start();
        }
    }

public slots:
    void start() override {
        auto id = Qt::TimerId(QObject::startTimer(deadline));
        if (id == Qt::TimerId::Invalid)
            return;
        mActiveTimerIds.insert(id);
    }

private:
    QSet<Qt::TimerId> mActiveTimerIds;
};
// @section-end:eventTask

#include <QtCore/QCoreApplication>

struct FilterEvent : public QEvent {
    inline static auto Type = QEvent::Type(QEvent::registerEventType());

    explicit FilterEvent(QString filter_)
      : QEvent(Type), filter(std::move(filter_)) { }

    const QString filter;
};

class TaskManager : public QObject
{
    Q_OBJECT

public:
    using QObject::QObject;
    ~TaskManager() override = default;
    Q_DISABLE_COPY_MOVE(TaskManager)

public slots:
    bool event(QEvent *ev) override {
        // We could also override 'QObject::customEvent'
        if (ev->type() != FilterEvent::Type)
            return QObject::event(ev);

        const auto *event = static_cast<FilterEvent*>(ev);
        const auto &filter = event->filter;
        const auto tasks = findChildren<Task*>();

        qInfo() << "TaskManager filters:" << filter
            << "on" << tasks.size() << "tasks.";

        for (auto *child : tasks) {
            if (!child->name.contains(filter))
                continue;
            child->start();
        }

        return true;
    }
};

#include <QtCore/QChronoTimer>
#include <QtCore/QPointer>
#include <QtCore/QTimer>

#include <iostream>

int main(int argc, char *argv[])
{
// @section-start:processor-task
    {
        Task task("task-1");
        genericObjectProcessor(task);
    }
// @section-end:processor-task

// @section-start:processor-thread
    {
        QThread thread;
        QObject::connect(
            &thread, &QThread::started,
            &thread, [](){ qInfo("Started Thread"); },
            Qt::DirectConnection
        );
        genericObjectProcessor(thread, Qt::DirectConnection);
    }
// @section-end:processor-thread

// @section-start:processor-timer
    {
        auto setupTimer = [](auto *timer) {
            using TimerType = std::remove_pointer_t<decltype(timer)>;
            QObject::connect(timer, &TimerType::timeout, timer, [timer]() {
                qInfo() << timer->metaObject()->className() << "timeout";
            });
        };

        QCoreApplication app(argc, argv);

        QTimer timer;
        setupTimer(&timer);
        genericObjectProcessor(timer);
        app.processEvents();

        QChronoTimer chronoTimer;
        setupTimer(&chronoTimer);
        genericObjectProcessor(chronoTimer);
        app.processEvents();
    }
// @section-end:processor-timer

// @section-start:qt-lifetime
    Task* subtask1;
    QPointer<Task> subtask2;
    std::cout << "\nBefore scope: subtask1=" << subtask1 << ", subtask2=" << subtask2 << '\n';
    {
        Task todoList("todo-list");
        todoList.setObjectName(todoList.name);

        subtask1 = new Task("subtask1", &todoList);
        new Task("task-1", subtask1);
        new Task("task-2", subtask1);

        subtask2 = new Task("subtask2", &todoList);
        new Task("task-3", subtask2);
        new Task("task-4", subtask2);

        QObject::connect(&todoList, &QObject::destroyed, &todoList, [](QObject *self){
            qInfo() << self << "destroyed. Starting any remaining children:";
            for (auto *task : self->findChildren<Task*>())
              task->start();
        });
    } // todoList goes out of scope
    std::cout << "After scope:  subtask1=" << subtask1 << ", subtask2=" << subtask2 << "\n";
// @section-end:qt-lifetime

    qInfo("\nDeadlineTask Start");
    {
        using namespace std::chrono_literals;
        QCoreApplication app(argc, argv);

        DeadlineTask task(1s, "deadline-1s");
        QObject::connect(&task, &DeadlineTask::finished, &task, [count = 0u]() mutable {
          if (++count == 3)
              qApp->exit();
        });
        task.start(); task.start(); task.start();

        app.exec();
    }
    qInfo("DeadlineTask End");


    qInfo("\nCustomEvent Start");
    {
        using namespace std::chrono_literals;
        QCoreApplication app(argc, argv);

        TaskManager taskManager;
        taskManager.setObjectName("root-manager");

        auto *alpha = new Task("alpha-task", &taskManager);
        new Task("alpha-1-task", alpha);
        new DeadlineTask(1s, "alpha-2-deadline", alpha);

        auto *beta = new DeadlineTask(2s, "beta-deadline", &taskManager);
        new DeadlineTask(500ms, "beta-1-deadline", beta);
        new Task("beta-2-task", beta);

        // Directly sends the event. Takes no ownership.
        FilterEvent taskFilter("task");
        QCoreApplication::sendEvent(&taskManager, &taskFilter);

        // Posts the event to the event queue. Takes ownership.
        QCoreApplication::postEvent(&taskManager, new FilterEvent("-1"));
        QCoreApplication::postEvent(&taskManager, new FilterEvent("deadline"));

        QObject::connect(beta, &DeadlineTask::finished, &app, QCoreApplication::quit);
        qInfo("Starting event-loop");
        app.exec();
    }
    qInfo("CustomEvent End");

    return 0;
}

#include "main.moc"
