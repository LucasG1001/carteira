from enums.device_type_enum import DeviceTypeEnum
from user_agents import parse


class RequestService:
    @staticmethod
    def get_device_type(user_agent_str: str) -> DeviceTypeEnum:
        user_agent = parse(user_agent_str)

        if user_agent.is_mobile:
            return DeviceTypeEnum.MOBILE
        elif user_agent.is_pc:
            return DeviceTypeEnum.PC
        elif user_agent.is_bot:
            return DeviceTypeEnum.BOT
        elif user_agent.is_tablet:
            return DeviceTypeEnum.TABLET
        else:
            return DeviceTypeEnum.UNKNOWN
