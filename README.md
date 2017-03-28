# FIS-assignment-3
During assignment 3 you have to illustrate use of selected messages from IPC-2501 and IPC-2541 standards. You have got a contract from a factory, who wants to monitor the status of their machines. The states of the machines have to be saved to the database in order to create later the trends for production system and its machines. This will allow factory to see the operations of their line in a longer term and search for optimisation options.

Each machine should implement CAMX communication approach. Therefore, you have to built a Message Broker (MSB). In order to test your MSB before deploying it for the actual line, you have to implement two clients - Machine Application (MA) (representing actual equipment) and Archiver Application (AA) (saves data to the database).
The system architecture can be depicted as follows: MA <---> MSB <---> AA.

The MA should implement EquipmentHeartbeat and EquipmentChangeState messages from IPC-2541 standard. The IPC-2501 standard has to be used for MA, MSB and AA integration. On MA side, you should implement the sequential change of the sates that would trigger MA sending EquipmentChangeState messages. On the AA side, you should be subscribed for EquipmentChangeState and EquipmentHeartbeat messages. AA should store to the database changing states and rise an alarm to the operator once it does not get the EquipmentHearbeat message in the due time. The rise of alarm can be just a printing to the console that the heartbeat is missing.

From the UI point of view, this assignment can be implemented using just consoles.
