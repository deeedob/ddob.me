// @section-start:task
#include <QtCore/QDateTime>
#include <QtCore/QObject>
#include <QtCore/QString>

class Task : public QObject
{
    Q_OBJECT

public:
    Task(QString name, QObject* parent = nullptr)
        : QObject(parent), name(name) { }
    ~Task() override = default;
    Q_DISABLE_COPY_MOVE_X(Task, "QObjects are identities!")

    const QString name;

signals:
    void finished();

public slots:
    void start() {
        qInfo().noquote() << "started: Task { name:" << name << "}, time: "
            << QDateTime::currentDateTimeUtc().toString("hh:mm:ss:zzz");
        emit finished();
    }
};

// @section-end:task

void recursiveChildren(QObject *object, const std::function<void(QObject *)> &func)
{
    if (!object)
        return;
    for (auto *child : object->children()) {
        func(child);
        recursiveChildren(child, func);
    }
}

// @section-start:processor
#include <QtCore/QMetaMethod>
#include <QtCore/QMetaObject>
#include <QtCore/QThread>

void genericObjectProcessor(QObject &object,
                            Qt::ConnectionType connectionType = Qt::AutoConnection)
{
    const auto *meta = object.metaObject();
    const QString className = meta->className();
    qInfo() << "\nGeneric processor on object class: " << className;

    // Connect to anything with a 'finished' signal.
    if (const auto index = meta->indexOfSignal("finished()"); index != -1) {
        const auto signal = meta->method(index);
        QMetaObject::connect(&object, signal, &object, [className](){
            qInfo() << "  finished() emitted on class: " << className;
        }, connectionType);
    }

    // Invoke anything with a 'start' slot.
    if (const auto index = meta->indexOfSlot("start()"); index != -1) {
        const auto slot = meta->method(index);
        slot.invoke(&object, connectionType);
    }

    // Check for the QThread class explicitly.
    if (auto *thread = qobject_cast<QThread*>(&object)) {
        thread->quit();
        thread->wait();
    }
}
// @section-end:processor

// @section-start:eventTask
#include <QtCore/QCoreApplication>
#include <QtCore/QEvent>

#include <chrono>

struct OperationEvent : public QEvent {
    static constexpr auto Type = QEvent::Type(QEvent::User);

    explicit OperationEvent(QString name)
      : QEvent(Type), targetName(std::move(name)) {}

    const QString targetName;
};

class DelayedTask : public Task
{
    Q_OBJECT

public:
    DelayedTask(std::chrono::nanoseconds delay, QString name, QObject *parent = nullptr)
        : Task(std::move(name), parent), delay(delay)
    {
    }
    ~DelayedTask() override = default;
    Q_DISABLE_COPY_MOVE(DelayedTask)

    const std::chrono::nanoseconds delay;

    bool event(QEvent *ev) override {
        switch (ev->type()) {
            case QEvent::Timer: {
                // we could also override 'QObject::timerEvent'
                auto timerEvId = static_cast<QTimerEvent*>(ev)->timerId();
                if (mActiveTimerIds.remove(timerEvId)) {
                    QObject::killTimer(timerEvId);    // timeout
                    DelayedTask::start();
                }
                return true;
            };
            case OperationEvent::Type: {
                auto *customEv = static_cast<OperationEvent*>(ev);
                if (customEv->targetName == name)
                    connect(this, &Task::finished, qApp, &QCoreApplication::quit);
                mActiveTimerIds.insert(QObject::startTimer(delay));
                recursiveChildren(this, [&](QObject *child){
                    if (auto *childTask = qobject_cast<DelayedTask*>(child))
                        childTask->event(ev);
                });
                return true;
            }
            default:
                return false;
        };
    }

private:
    QSet<int> mActiveTimerIds;
    static constexpr int Value = 100;
};
// @section-end:eventTask

#include <QtCore/QChronoTimer>
#include <QtCore/QTimer>
#include <QtCore/QElapsedTimer>
#include <QtCore/QPointer>



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
            &thread, [](){ qInfo("thread started"); },
            Qt::DirectConnection
        );
        genericObjectProcessor(thread, Qt::DirectConnection);
    }
// @section-end:processor-thread

// @section-start:processor-timer
    {
        auto setupTimer = [](auto *timer) {
            using TimerType = std::remove_pointer_t<decltype(timer)>;
            timer->setSingleShot(true);
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
            recursiveChildren(self, [](QObject *child) {
                if (auto *task = qobject_cast<Task*>(child))
                    task->start();
            });
        });
    } // todoList goes out of scope
    std::cout << "After scope:  subtask1=" << subtask1 << ", subtask2=" << subtask2 << "\n";
// @section-end:qt-lifetime

// @section-start:qt-events
    qInfo("\nDelayedTask Start");
    {
        using namespace std::chrono_literals;
        QCoreApplication app(argc, argv);

        DelayedTask root(1s, "root");
        new DelayedTask(2s, "root-1", &root);
        auto * subtask = new DelayedTask(1s, "subtask", &root);
        new DelayedTask(1s, "subtask-1", subtask);
        new DelayedTask(5s, "subtask-2", subtask);
        new DelayedTask(3s, "longest-task", subtask);

        // {
        //     OperationEvent event(OperationEvent::CloseWhenFinished, "root-1");
        //     QCoreApplication::sendEvent(&root, &event);
        // } // event has been sent already!

        QCoreApplication::postEvent(&root,
            new OperationEvent("longest-task"));
        QCoreApplication::exec();
    }
    qInfo("DelayedTask End");
// @section-end:qt-events

// @section-start:qt-event-timers
    // qInfo("\nQt Event Timers Start");
    {
        // QCoreApplication app(argc, argv);
        // QObject::connect(&app, &QCoreApplication::aboutToQuit, &app, []{
        //     qInfo() << "Quit Time" << QTime::currentTime();
        // });
        //
        // EventTask parent(nullptr);
        // new EventTask(&parent, QEvent::Timer);
        //
        // qInfo() << "Start Time" << QTime::currentTime();
        //
        // QTimerEvent timer1(parent.startTimer(2s));
        // qInfo() << "timer1 started" << timer1.;
        // QCoreApplication::exec();
        //
        // // qInfo() << QTimerEvent(parent.startTimer(2s)).id();
        // QCoreApplication::exec();
    }
    // qInfo("Qt Event Timers End");
// @section-end:qt-event-timers

    return 0;
}

#include "main.moc"
